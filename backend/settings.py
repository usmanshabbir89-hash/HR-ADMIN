"""
settings.py - Company settings in one place.
Change these values to match your company; the rest of the code reads them from here.
"""
from datetime import time

# Shown on salary certificates
COMPANY_NAME = "ABC Technologies (Pvt) Ltd"
COMPANY_ADDRESS = "123 Main Boulevard, Business District"
COMPANY_PHONE = "+00 000 0000000"
COMPANY_EMAIL = "hr@company.com"
HR_SIGNATORY = "HR Manager"
CURRENCY = "PKR"  # change to your currency, e.g. "USD", "AED", "INR"

# Attendance rules
OFFICE_START = time(9, 0)    # office starts at 09:00
LATE_AFTER = time(9, 15)     # checking in after 09:15 counts as "Late" (15 minutes grace)
