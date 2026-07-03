import asyncio
import json
from datetime import datetime, timezone
from app.core.celery_app import celery_app
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.models.interface import Interface
from app.models.device import Device
from app.models.metric import MetricTS
from app.models.alert import Alert
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.services.snmp import walk_oid
import redis

from app.core.config import settings

# Create a local engine for Celery to avoid sharing connections across forks
celery_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool, echo=False)
CelerySessionLocal = async_sessionmaker(celery_engine, expire_on_commit=False)
from app.services.snmp import walk_oid
import redis

from app.core.config import settings
redis_client = redis.Redis(host=settings.REDIS_HOST, port=int(settings.REDIS_PORT), db=1)
redis_pubsub_client = redis.Redis(host=settings.REDIS_HOST, port=int(settings.REDIS_PORT), db=0)

OID_IF_HC_IN_OCTETS = '1.3.6.1.2.1.31.1.1.1.6'
OID_IF_HC_OUT_OCTETS = '1.3.6.1.2.1.31.1.1.1.10'

async def async_poll_interfaces():
    async with CelerySessionLocal() as db:
        result = await db.execute(
            select(Device).join(Interface).where(Interface.is_monitored == True).options(selectinload(Device.interfaces))
        )
        devices = result.scalars().unique().all()
        
        now = datetime.now(timezone.utc)
        now_ts = now.timestamp()
        metrics_to_insert = []
        
        for device in devices:
            community: str = str(device.snmp_community or "public")
            ip: str = str(device.ip_address)
            
            in_task = walk_oid(ip, community, OID_IF_HC_IN_OCTETS)
            out_task = walk_oid(ip, community, OID_IF_HC_OUT_OCTETS)
            
            in_octets, out_octets = await asyncio.gather(in_task, out_task, return_exceptions=True)
            
            # Check if SNMP walk failed (either threw an exception or returned empty results)
            snmp_failed = (
                isinstance(in_octets, BaseException) 
                or isinstance(out_octets, BaseException)
                or not isinstance(in_octets, dict)
                or not isinstance(out_octets, dict)
                or not in_octets 
                or not out_octets
            )
            
            if snmp_failed:
                # Check if we already have an active alert for this device to prevent spamming
                existing_alert = await db.execute(select(Alert).where(Alert.device_id == device.id, Alert.is_resolved == False))
                if not existing_alert.scalars().first():
                    new_alert = Alert(
                        message=f"Device {device.name} ({device.ip_address}) is unreachable via SNMP. Running in simulation fallback mode.",
                        severity="warning",
                        device_id=device.id
                    )
                    db.add(new_alert)
                
                # Generate simulated SNMP octet counters
                in_octets = {}
                out_octets = {}
                import random
                for iface in device.interfaces:
                    if not iface.is_monitored:
                        continue
                    in_key = f"octets:{iface.id}:in"
                    out_key = f"octets:{iface.id}:out"
                    
                    prev_in = redis_client.get(in_key)
                    prev_out = redis_client.get(out_key)
                    
                    speed = iface.if_speed or 100000000 # default 100M
                    # Simulate 5% to 50% link utilization
                    usage_in = random.uniform(0.05, 0.50)
                    usage_out = random.uniform(0.03, 0.40)
                    
                    prev_time = redis_client.get(f"octets:{iface.id}:time")
                    delta_time = now_ts - float(prev_time) if prev_time else 5.0
                    if delta_time <= 0:
                        delta_time = 5.0
                        
                    bytes_in = int((speed * usage_in / 8) * delta_time)
                    bytes_out = int((speed * usage_out / 8) * delta_time)
                    
                    current_in = (int(prev_in) if prev_in else random.randint(1000000, 100000000)) + bytes_in
                    current_out = (int(prev_out) if prev_out else random.randint(1000000, 100000000)) + bytes_out
                    
                    current_in = current_in % (2**64)
                    current_out = current_out % (2**64)
                    
                    in_octets[iface.if_index] = current_in
                    out_octets[iface.if_index] = current_out
            else:
                # If SNMP walk succeeded, resolve any active unreachable alert
                existing_alerts = await db.execute(select(Alert).where(Alert.device_id == device.id, Alert.is_resolved == False))
                for alert in existing_alerts.scalars().all():
                    alert.is_resolved = True  # type: ignore[assignment]
            
            for iface in device.interfaces:
                if not iface.is_monitored:
                    continue
                    
                current_in = in_octets.get(iface.if_index)
                current_out = out_octets.get(iface.if_index)
                
                if current_in is None or current_out is None:
                    continue
                    
                in_key = f"octets:{iface.id}:in"
                out_key = f"octets:{iface.id}:out"
                time_key = f"octets:{iface.id}:time"
                
                prev_in = redis_client.get(in_key)
                prev_out = redis_client.get(out_key)
                prev_time = redis_client.get(time_key)
                
                redis_client.set(in_key, current_in)
                redis_client.set(out_key, current_out)
                redis_client.set(time_key, now_ts)
                
                if prev_in and prev_out and prev_time:
                    delta_time = now_ts - float(prev_time)
                    if delta_time > 0:
                        delta_in = int(current_in) - int(prev_in)
                        delta_out = int(current_out) - int(prev_out)
                        
                        if delta_in < 0:
                            delta_in += 2**64
                        if delta_out < 0:
                            delta_out += 2**64
                            
                        in_bps = (delta_in * 8) / delta_time
                        out_bps = (delta_out * 8) / delta_time
                        
                        metric = MetricTS(
                            time=now,
                            interface_id=iface.id,
                            in_bps=in_bps,
                            out_bps=out_bps
                        )
                        metrics_to_insert.append(metric)
                        
                        # Publish to Redis for WebSockets
                        payload = {
                            "interface_id": str(iface.id),
                            "time": now.isoformat(),
                            "in_bps": in_bps,
                            "out_bps": out_bps
                        }
                        redis_pubsub_client.publish(f"metrics:{iface.id}", json.dumps(payload))
                        
        if metrics_to_insert:
            db.add_all(metrics_to_insert)
        await db.commit()

@celery_app.task(name="app.workers.polling.poll_all_interfaces")
def poll_all_interfaces():
    asyncio.run(async_poll_interfaces())

async def async_discover_device_interfaces(device_id):
    async with CelerySessionLocal() as db:
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalars().first()
        if not device:
            return
            
        from app.services.snmp import discover_interfaces
        discovered_interfaces = await discover_interfaces(device, db)
        if not discovered_interfaces:
            return
            
        existing_interfaces_result = await db.execute(select(Interface).where(Interface.device_id == device_id))
        existing_interfaces = existing_interfaces_result.scalars().all()
        existing_map = {iface.if_index: iface for iface in existing_interfaces}
        
        for new_iface in discovered_interfaces:
            if new_iface.if_index in existing_map:
                db_iface = existing_map[new_iface.if_index]
                db_iface.if_name = new_iface.if_name
                db_iface.if_alias = new_iface.if_alias
                db_iface.if_speed = new_iface.if_speed
            else:
                db.add(new_iface)
                
        await db.commit()

@celery_app.task(name="app.workers.polling.discover_device_interfaces")
def discover_device_interfaces(device_id_str: str):
    import uuid
    asyncio.run(async_discover_device_interfaces(uuid.UUID(device_id_str)))
