from datetime import datetime, timedelta, timezone

edt_offset = timezone(timedelta(hours=-4))

def convert_time(value, to_met=True):
    """
    Converts between EDT and MET for the Artemis II mission.
    
    Launch Time: April 1, 2026, 18:35:00 EDT (UTC-4)
    """
    # Define Launch Time in UTC-4 (EDT)
    launch_time = datetime(2026, 4, 1, 18, 35, 0, tzinfo=edt_offset)
    
    if to_met:
        # Input 'value' is expected to be a datetime object in EDT
        # If no value is provided, it uses the current time (April 6, 2026)
        current_time = value if value else datetime.now(edt_offset)
        
        diff = current_time - launch_time
        total_seconds = int(diff.total_seconds())
        
        days = total_seconds // 86400
        hours = (total_seconds % 86400) // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        return f"MET {days}/{hours:02}:{minutes:02}:{seconds:02}"
    
    else:
        # Input 'value' is expected to be a dictionary or tuple: (days, hours, minutes)
        d, h, m = value
        met_delta = timedelta(days=d, hours=h, minutes=m)
        target_edt = launch_time + met_delta
        
        return target_edt.strftime('%Y-%m-%d %H:%M:%S %Z')

# Example Usage:
# 1. Get current MET (as of April 6, 2026)
#print(f"Current Status: {convert_time(None, to_met=True)}")

# 2. Find the EDT for a specific MET (e.g., MET 5 days, 2 hours, 15 minutes)
#future_event = (5, 2, 15)
#print(f"Event Time (EDT): {convert_time(future_event, to_met=False)}")
print(f"Flyby Plan Briefing: \t{convert_time(datetime(2026, 4, 6, 13, 30, 0, tzinfo=edt_offset), to_met=True)}")
print(f"Distance Record: \t{convert_time(datetime(2026, 4, 6, 13, 56, 0, tzinfo=edt_offset), to_met=True)}")
print(f"Observation Start: \t{convert_time(datetime(2026, 4, 6, 14, 45, 0, tzinfo=edt_offset), to_met=True)}")
print(f"Blackout Begins: \t{convert_time(datetime(2026, 4, 6, 18, 44, 0, tzinfo=edt_offset), to_met=True)}")
print(f"Closest Approach: \t{convert_time(datetime(2026, 4, 6, 19, 2, 0, tzinfo=edt_offset), to_met=True)}")
print(f"Farthest Distance: \t{convert_time(datetime(2026, 4, 6, 19, 7, 0, tzinfo=edt_offset), to_met=True)}")
print(f"Blackout Ends: \t\t{convert_time(datetime(2026, 4, 6, 19, 25, 0, tzinfo=edt_offset), to_met=True)}")
print(f"End of Observations: \t{convert_time(datetime(2026, 4, 6, 21, 20, 0, tzinfo=edt_offset), to_met=True)}")