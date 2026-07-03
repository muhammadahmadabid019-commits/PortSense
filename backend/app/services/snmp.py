import asyncio
from typing import List, Dict, Any

from pysnmp.hlapi.asyncio import (
    SnmpEngine,
    CommunityData,
    UdpTransportTarget,
    ContextData,
    ObjectType,
    ObjectIdentity,
    walk_cmd,
)
from app.models.device import Device
from app.models.interface import Interface
from sqlalchemy.ext.asyncio import AsyncSession

# Standard IF-MIB OIDs
OID_IF_INDEX = '1.3.6.1.2.1.2.2.1.1'
OID_IF_NAME  = '1.3.6.1.2.1.31.1.1.1.1'
OID_IF_DESCR = '1.3.6.1.2.1.2.2.1.2'
OID_IF_ALIAS = '1.3.6.1.2.1.31.1.1.1.18'
OID_IF_SPEED = '1.3.6.1.2.1.2.2.1.5'


async def walk_oid(target_ip: str, community: str, oid_str: str) -> Dict[int, Any]:
    """
    Walk a single OID subtree using SNMPv2c and return a mapping of
    {last_oid_component: value}.  Each call owns its own SnmpEngine so
    that concurrent walks do not share state.
    """
    snmp_engine = SnmpEngine()
    results: Dict[int, Any] = {}

    try:
        async for (errorIndication, errorStatus, errorIndex, varBinds) in walk_cmd(
            snmp_engine,
            CommunityData(community, mpModel=1),
            await UdpTransportTarget.create((target_ip, 161), timeout=2.0, retries=2),
            ContextData(),
            ObjectType(ObjectIdentity(oid_str)),
            lexicographicMode=False,
        ):
            if errorIndication or errorStatus or not varBinds:
                break

            for varBind in varBinds:
                oid   = varBind[0]
                value = varBind[1]
                try:
                    index = int(str(oid).split('.')[-1])
                    if hasattr(value, 'prettyPrint'):
                        val_str = value.prettyPrint()
                        try:
                            results[index] = int(val_str)
                        except ValueError:
                            results[index] = val_str
                    else:
                        results[index] = str(value)
                except Exception:
                    pass
    except Exception:
        pass

    return results


async def discover_interfaces(device: Device, db: AsyncSession) -> List[Interface]:
    community: str = str(device.snmp_community or "public")
    ip: str = str(device.ip_address)

    names_task  = walk_oid(ip, community, OID_IF_NAME)
    descrs_task = walk_oid(ip, community, OID_IF_DESCR)
    aliases_task = walk_oid(ip, community, OID_IF_ALIAS)
    speeds_task = walk_oid(ip, community, OID_IF_SPEED)

    names, descrs, aliases, speeds = await asyncio.gather(
        names_task, descrs_task, aliases_task, speeds_task,
        return_exceptions=True,
    )

    # Fall back to IF-MIB ifDescr if ifName is unavailable
    if isinstance(names, Exception) or not names:
        names = descrs if isinstance(descrs, dict) else {}

    # Final guard — narrows `names` from `dict | BaseException` to `dict`
    if not isinstance(names, dict) or not names:
        return []

    interfaces_discovered: List[Interface] = []

    for if_index, name in names.items():
        alias = aliases.get(if_index, "") if isinstance(aliases, dict) else ""
        speed = speeds.get(if_index, 0)   if isinstance(speeds,  dict) else 0

        interface = Interface(
            device_id=device.id,
            if_index=if_index,
            if_name=name,
            if_alias=alias,
            if_speed=speed,
            is_monitored=False,
        )
        interfaces_discovered.append(interface)

    return interfaces_discovered
