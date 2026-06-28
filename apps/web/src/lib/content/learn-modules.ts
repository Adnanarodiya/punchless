import type { LearnCategory, LearnModule } from "./learn-types";

export const learnCategories: LearnCategory[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Your financial HQ and daily operations snapshot.",
  },
  {
    id: "people",
    label: "People",
    description: "Employees, job posts, and workshop locations.",
  },
  {
    id: "operations",
    label: "Operations",
    description: "Attendance, history, corrections, and jobs.",
  },
  {
    id: "commerce",
    label: "Commerce",
    description: "Customers, suppliers, invoices, and supplier bills.",
  },
  {
    id: "finance",
    label: "Finance",
    description: "Income & expense entries and bank accounts.",
  },
  {
    id: "payroll",
    label: "Payroll",
    description: "Salary calculation, payments, and advances.",
  },
  {
    id: "reports",
    label: "Reports",
    description: "Daily, monthly, GST, and ledger reports.",
  },
  {
    id: "account",
    label: "Account",
    description: "Settings, users, security, and audit trail.",
  },
];

export const learnModules: LearnModule[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    category: "overview",
    icon: "layout-dashboard",
    summary: "Financial HQ + live workshop operations at a glance.",
    href: "/dashboard",
    roles: ["owner", "admin"],
    overview:
      "The Dashboard is your command centre. It combines money (income, expense, dues, revenue chart), payroll (today's payments), and operations (who is working, active jobs, pending advances) in one screen. Use the financial year selector to switch FY views; use the data lock PIN to hide sensitive amounts when someone is watching your screen.",
    howItWorks: [
      "Indian financial year selector (1 Apr – 31 Mar) filters the six financial overview cards.",
      "Financial cards show Income, Expense, Cash (net), Bank balance, Customer credit, and Supplier payable — masked until you unlock with the data lock PIN from the header or dashboard.",
      "Quick actions jump you to common tasks: add invoice, record payment, add employee, etc.",
      "Today's payments lists salary and staff payouts recorded today.",
      "Pending dues shows top customer balances you need to collect.",
      "Revenue chart toggles between last 7 days and last 6 months.",
      "Sticky notes are personal reminders pinned on the dashboard.",
      "Operations cards link to Employees, Attendance, Jobs, and Advances with live counts.",
      "Recent tables show the latest attendance sessions and jobs.",
      "Setup checklist (dismissible) guides new owners through profile, workshop, posts, and employees.",
      "Press Ctrl+K (Cmd+K on Mac) anywhere to search customers, suppliers, invoices, jobs, and jump straight to statements.",
    ],
    pageSections: [
      {
        title: "Setup checklist",
        description:
          "Appears until dismissed or all setup steps are done — links to Settings, Workshops, Posts, Employees, and Learn.",
      },
      {
        title: "Page header",
        description:
          "Live clock, financial year dropdown, and data lock controls (set PIN in Settings).",
      },
      {
        title: "Financial cards",
        description:
          "Six cards for the selected Indian FY: Income, Expense, Cash (net), Bank balance, Customer credit, Supplier payable.",
      },
      {
        title: "Quick actions",
        description: "Shortcut buttons to frequently used pages and forms.",
      },
      {
        title: "Today's payments",
        description: "All staff/customer/supplier payments recorded today with amounts.",
      },
      {
        title: "Pending dues",
        description: "Top customers with outstanding balances — click to open their statement.",
      },
      {
        title: "Revenue chart",
        description: "Bar chart of daily or monthly revenue. Switch range with 7D / 6M toggle.",
      },
      {
        title: "Sticky notes",
        description: "Add, edit, colour-code, and delete personal reminder notes.",
      },
      {
        title: "Operations",
        description:
          "Four stat cards: Active Employees, Currently Working, Active Jobs, Pending Advances.",
      },
      {
        title: "Recent activity",
        description: "Tables for recent attendance sessions and recent jobs.",
      },
    ],
    workflows: [
      {
        title: "Morning check-in routine",
        steps: [
          "Open Dashboard and confirm how many employees are Currently Working.",
          "Review Today's payments to see what was already paid out.",
          "Check Pending dues for customers to follow up today.",
          "Glance at Active Jobs to see field work in progress.",
        ],
      },
      {
        title: "Unlock financial data",
        steps: [
          "If amounts show as masked (••••), click the lock icon in the top header (any page).",
          "Enter your data lock PIN (set in Settings → Data Lock).",
          "Dashboard cards, salary totals, customer dues, bank balances, and related amounts become visible until you lock again or leave the app idle for 5 minutes.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Log in as owner and open /dashboard.",
        expected:
          "Page loads with financial cards, operations stats, and recent tables. No errors.",
      },
      {
        step: 2,
        action: "Change the financial year dropdown to a previous FY.",
        expected:
          "Income, expense, and net cards update to reflect that year's data.",
      },
      {
        step: 3,
        action: "Click 'Currently Working' operations card.",
        expected: "Navigates to /dashboard/attendance with live sessions visible.",
      },
      {
        step: 4,
        action: "Add a sticky note with text 'Test note' and save.",
        expected: "Note appears on dashboard; persists after page refresh.",
      },
      {
        step: 5,
        action: "Toggle revenue chart from 7D to 6M.",
        expected: "Chart switches to monthly bars; URL updates with ?chart=6m.",
      },
      {
        step: 6,
        action: "Dismiss the setup checklist with the X button, refresh the page.",
        expected: "Checklist stays hidden for this browser session.",
      },
      {
        step: 7,
        action: "Press Ctrl+K, search a client name, open the statement result.",
        expected: "Global search opens the client ledger statement page.",
      },
    ],
    tips: [
      "Use Ctrl+K global search from the header to jump to any client, employee, or invoice.",
      "Set a data lock PIN if admins share the screen with workshop staff.",
      "Operations cards are clickable — they are shortcuts, not just stats.",
    ],
    relatedModuleIds: ["attendance", "salary", "invoices", "settings"],
  },
  {
    id: "employees",
    title: "Employees",
    category: "people",
    icon: "users",
    summary: "Add, edit, and manage workshop staff with salary and bank details.",
    href: "/dashboard/employees",
    roles: ["owner", "admin"],
    overview:
      "Employees are your workshop staff who use the mobile app for attendance. Each employee has a monthly salary (auto-converted to hourly rate), workshop assignment, post/title, bank details for salary deposits, and an active/inactive status. Deactivated employees cannot log in on mobile but their history is preserved.",
    howItWorks: [
      "Monthly salary + company work schedule (Settings) → automatic hourly rate.",
      "Workshop assignment determines which geofence they punch into on mobile.",
      "Post links to the Posts module (e.g. Mechanic, Supervisor).",
      "Employee cards show quick links to Payments, Statement, and History.",
      "Invite flow: you set email + temp password; employee logs in on mobile and should change password.",
    ],
    pageSections: [
      {
        title: "Summary cards",
        description: "Total employees and active count at the top.",
      },
      {
        title: "Search bar",
        description: "Filter employee cards by name or email.",
      },
      {
        title: "Employee cards",
        description:
          "Each card shows name, post, workshop, salary, hourly rate, tenure, and status badge.",
      },
      {
        title: "Add / Edit modal",
        description:
          "Form: name, email, phone, address, post, joining date, workshop, monthly salary, bank A/C + IFSC, active toggle.",
      },
      {
        title: "Quick action links",
        description: "Payments, Statement, and Attendance History per employee.",
      },
    ],
    workflows: [
      {
        title: "Onboard a new mechanic",
        steps: [
          "Create a Post first (e.g. 'Mechanic') if it does not exist.",
          "Create a Workshop with GPS coordinates.",
          "Click Add Employee, fill details, assign workshop and post.",
          "Share email + temp password with the employee for mobile login.",
          "Employee opens mobile app → logs in → starts attendance at assigned workshop.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Add employee 'Test Mechanic' with ₹25,000/month salary.",
        expected:
          "Card appears in grid; hourly rate auto-calculated from Settings work hours.",
      },
      {
        step: 2,
        action: "Deactivate the employee.",
        expected: "Status badge shows Inactive; employee cannot log in on mobile.",
      },
      {
        step: 3,
        action: "Click Payments link on employee card.",
        expected:
          "Opens /dashboard/salary/payments filtered to that employee.",
      },
    ],
    tips: [
      "Always assign a workshop before expecting GPS attendance to work.",
      "Monthly salary changes recalculate hourly rate on save.",
    ],
    relatedModuleIds: ["posts", "workshops", "attendance", "salary", "payments"],
  },
  {
    id: "posts",
    title: "Posts",
    category: "people",
    icon: "user-circle",
    summary: "Job titles/roles assigned to employees (Mechanic, Supervisor, etc.).",
    href: "/dashboard/posts",
    roles: ["owner", "admin"],
    overview:
      "Posts are simple job titles used when creating employees. They help organise staff by role and appear on employee cards and reports. Soft-delete keeps history intact.",
    howItWorks: [
      "Create a post name (e.g. Mechanic, Electrician, Supervisor).",
      "Assign posts when adding or editing employees.",
      "Deleted posts are hidden but employees keep their assignment reference.",
    ],
    pageSections: [
      { title: "Summary", description: "Count of active posts." },
      { title: "Add/Edit form", description: "Single field: post name." },
      { title: "Data table", description: "Active and deleted posts with edit/delete actions." },
    ],
    workflows: [
      {
        title: "Set up roles before hiring",
        steps: [
          "Create all workshop roles as Posts first.",
          "Then add employees and pick the matching post from the dropdown.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Create post 'Senior Mechanic'.",
        expected: "Appears in active table; available in employee form dropdown.",
      },
      {
        step: 2,
        action: "Soft-delete the post.",
        expected: "Moves to deleted view; no longer in employee dropdown for new hires.",
      },
    ],
    tips: ["Keep post names short — they appear on compact employee cards."],
    relatedModuleIds: ["employees"],
  },
  {
    id: "workshops",
    title: "Workshops",
    category: "people",
    icon: "map-pin",
    summary: "Physical workshop locations with GPS geofence for attendance.",
    href: "/dashboard/workshops",
    roles: ["owner", "admin"],
    overview:
      "Workshops define where employees can punch in. Each has a name, address, map coordinates, and geofence radius. The mobile app uses GPS to detect when an employee enters the workshop zone and auto-starts a workshop attendance session.",
    howItWorks: [
      "Pick location on the map or paste a Google Maps URL to resolve coordinates.",
      "Set geofence radius (meters) — employee must be within this circle.",
      "Assign employees to a workshop so their mobile attendance ties to that location.",
      "Deactivate workshops you no longer use; they won't appear for new assignments.",
    ],
    pageSections: [
      { title: "Summary cards", description: "Total and active workshop counts." },
      { title: "Search", description: "Filter workshop cards by name." },
      { title: "Workshop cards", description: "Name, address, radius, active status." },
      {
        title: "Add/Edit modal",
        description: "Name, address, map picker, radius slider, active toggle.",
      },
    ],
    workflows: [
      {
        title: "Add a new branch workshop",
        steps: [
          "Open Workshops → Add Workshop.",
          "Enter name and address.",
          "Click on the map at the exact workshop location (or use Google Maps URL).",
          "Set radius (e.g. 100m) and save.",
          "Reassign or add employees to this workshop.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Create workshop with radius 150m at a known lat/lng.",
        expected: "Card shows coordinates and radius; appears in attendance session form.",
      },
      {
        step: 2,
        action: "Assign an employee to this workshop.",
        expected: "Employee mobile app uses this geofence for workshop state.",
      },
    ],
    tips: [
      "Test geofence on a real phone — emulators give inaccurate GPS.",
      "Use a slightly larger radius if the workshop has a big yard.",
    ],
    relatedModuleIds: ["employees", "attendance"],
  },
  {
    id: "attendance",
    title: "Attendance",
    category: "operations",
    icon: "clock",
    summary: "Live sessions, manual entry, bulk mark, and printable daily sheet.",
    href: "/dashboard/attendance",
    roles: ["owner", "admin"],
    overview:
      "Attendance tracks where employees are: workshop, travel, on-site job, break, or off duty. The Live tab shows who is working right now. Admins can manually add or close sessions, bulk-mark a day present, and print today's sheet.",
    howItWorks: [
      "Mobile employees auto-start sessions via GPS (workshop geofence, job geofence, travel).",
      "States: workshop, travel, on_site_job, break — each may have different hourly pay.",
      "Manual sessions let admins correct missing punches or add backdated entries.",
      "Bulk tab: pick date + workshop + check employees → mark all present for that day.",
      "Sheet tab: printable attendance register for today.",
    ],
    pageSections: [
      {
        title: "Stats row",
        description: "Active now, workshop count, travel count, on-site count.",
      },
      { title: "Live tab", description: "Currently open sessions with live duration timers." },
      { title: "Today tab", description: "All sessions that started or ended today." },
      {
        title: "Bulk tab",
        description: "Mass mark-present for a date and workshop.",
      },
      { title: "Sheet tab", description: "Print-friendly daily attendance sheet." },
      {
        title: "Add Session form",
        description:
          "Employee, state, workshop/job, start time, end time (or leave open for live).",
      },
    ],
    workflows: [
      {
        title: "Fix a missed punch",
        steps: [
          "Go to Attendance → Add Session.",
          "Select employee, state (e.g. workshop), workshop, start and end times.",
          "Save — session appears in Today and feeds into salary calculation.",
        ],
      },
      {
        title: "Close a forgotten live session",
        steps: [
          "Open Live tab, find the employee still showing as active.",
          "Close session with the correct end time.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "View Live tab during work hours.",
        expected: "Employees who punched in on mobile appear with increasing duration.",
      },
      {
        step: 2,
        action: "Manually add a 8h workshop session for yesterday.",
        expected: "Session in Today/History; reflected in salary for that month.",
      },
      {
        step: 3,
        action: "Bulk mark 3 employees present for today.",
        expected: "Three sessions created; salary report shows hours/days for them.",
      },
    ],
    tips: [
      "Attendance data directly drives Salary — fix attendance before running payroll.",
      "Use Requests module for employee-initiated corrections instead of manual edits when possible.",
    ],
    relatedModuleIds: ["history", "requests", "salary", "workshops", "jobs"],
  },
  {
    id: "history",
    title: "History",
    category: "operations",
    icon: "history",
    summary: "Attendance history with employee summaries, session detail, and CSV export.",
    href: "/dashboard/history",
    roles: ["owner", "admin"],
    overview:
      "History lets you analyse past attendance. Switch between employee summary (aggregated hours/days) and all sessions (raw log). Filter by period, drill into one employee, and export CSV for payroll review.",
    howItWorks: [
      "Period filter: Today, Last 7 days, This month.",
      "Employee Summary tab: per-employee totals split by workshop/travel/on-site.",
      "All Sessions tab: every session row with times and duration.",
      "Click an employee to see only their sessions with back navigation.",
      "Export CSV for external analysis or auditor records.",
    ],
    pageSections: [
      { title: "Period filter", description: "Quick date range presets." },
      { title: "Employee Summary", description: "Aggregated minutes/hours per employee." },
      { title: "All Sessions", description: "Chronological session list with pagination." },
      { title: "Employee drill-down", description: "Filtered view for one employee." },
      { title: "Export CSV", description: "Download current view as spreadsheet." },
    ],
    workflows: [
      {
        title: "Review month before payroll",
        steps: [
          "Set period to This month.",
          "Open Employee Summary — verify hours/days look reasonable.",
          "Drill into outliers (very low or very high hours).",
          "Cross-check with Salary page for the same month.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Select 'Last 7 days' and view Employee Summary.",
        expected: "Each active employee shows session count and minute breakdown.",
      },
      {
        step: 2,
        action: "Click an employee name.",
        expected: "Session list filters to that employee only; back button returns.",
      },
      {
        step: 3,
        action: "Export CSV.",
        expected: "File downloads with session rows matching the current filter.",
      },
    ],
    tips: ["Compare History totals with Salary adjusted hours before paying staff."],
    relatedModuleIds: ["attendance", "salary", "requests"],
  },
  {
    id: "requests",
    title: "Requests",
    category: "operations",
    icon: "file-edit",
    summary: "Approve or reject employee attendance correction requests.",
    href: "/dashboard/requests",
    roles: ["owner", "admin"],
    overview:
      "When employees notice wrong hours on mobile, they submit correction requests. Admins review pending requests, compare original vs requested values, add notes, and approve or reject. Approved requests update attendance records.",
    howItWorks: [
      "Request types: break correction, session correction, missing session.",
      "Pending tab is the default inbox.",
      "Approve → attendance data updates to requested values.",
      "Reject → no change; employee sees rejection on mobile.",
      "Optional admin notes are stored for audit trail.",
    ],
    pageSections: [
      { title: "Status tabs", description: "Pending, All, Approved, Rejected filters." },
      {
        title: "Request cards",
        description:
          "Employee, date, type, reason, side-by-side original vs requested times/state.",
      },
      { title: "Action buttons", description: "Approve and Reject with optional notes field." },
    ],
    workflows: [
      {
        title: "Process daily correction queue",
        steps: [
          "Open Requests → Pending tab each morning.",
          "Read employee reason and compare times.",
          "Approve if legitimate; reject with note if not.",
          "Re-check affected employee in History after approval.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Submit a correction from mobile (or seed data).",
        expected: "Request appears in Pending with original vs requested comparison.",
      },
      {
        step: 2,
        action: "Approve with note 'Confirmed with supervisor'.",
        expected: "Status → Approved; attendance session updated; note saved.",
      },
    ],
    tips: ["Process pending requests before monthly salary run to avoid wrong pay."],
    relatedModuleIds: ["attendance", "history", "salary"],
  },
  {
    id: "jobs",
    title: "Jobs",
    category: "operations",
    icon: "briefcase",
    summary: "On-site jobs with customer info, assignee, and GPS geofence.",
    href: "/dashboard/jobs",
    roles: ["owner", "admin"],
    overview:
      "Jobs represent off-site work (customer location). Create a job with title, customer details, assign an employee, and set a map location + radius. Status flows: pending → assigned → in_progress → completed (or cancelled). Mobile employees can travel to and work on-site at the job geofence.",
    howItWorks: [
      "Create job with map picker — same pattern as workshops.",
      "Assign employee — they see the job on mobile.",
      "Status updates track job lifecycle.",
      "On-site attendance at job location counts toward salary (same hourly rate).",
      "Optional link to client and vehicle number for invoicing.",
    ],
    pageSections: [
      { title: "Create/Edit form", description: "Left panel: title, description, customer, assignee, map, radius, status." },
      { title: "Job list", description: "Right panel: cards with status badges and quick edit." },
      { title: "Job detail page", description: "/dashboard/jobs/[id] — full job info and status controls." },
    ],
    workflows: [
      {
        title: "Dispatch mechanic to customer",
        steps: [
          "Create job with customer name/phone and map location.",
          "Assign available mechanic; set status to Assigned.",
          "Mechanic travels (travel state on mobile) then arrives (on_site_job).",
          "Mark completed when work is done; create invoice if billing client.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Create job 'AC Repair' with map location and assign employee.",
        expected: "Job card appears; employee sees job on mobile app.",
      },
      {
        step: 2,
        action: "Change status to In Progress then Completed.",
        expected: "Status badge updates; job moves out of active count on dashboard.",
      },
    ],
    tips: ["Link jobs to customers when you plan to invoice — saves re-typing customer info."],
    relatedModuleIds: ["attendance", "invoices", "employees"],
  },
  {
    id: "clients",
    title: "Customers",
    category: "commerce",
    icon: "building2",
    summary: "Customer CRM with dues tracking, payments, and ledger statements.",
    href: "/dashboard/customers",
    roles: ["owner", "admin"],
    overview:
      "Customers are people or businesses who owe you money for workshop work. Track contact info, GST, opening balance, and running due amount. Record payments (cash/bank), view Shahin-style ledger statements, and soft-delete inactive customers.",
    howItWorks: [
      "Customer money flow panel at the top: Add customer → invoice → receive payment → statement.",
      "Creating a customer can include an opening balance (starting due).",
      "Tax invoices add to customer due; payments reduce it.",
      "Receive Payment modal: cash or bank, amount, date, remark. Payments of ₹5,000+ ask for confirmation.",
      "Row actions: ₹ pay, receipt icon for new invoice, statement link.",
      "Deep links: ?customer=ID&open=pay opens pay modal; ?open=invoice jumps to new invoice form.",
      "Statement page shows full ledger with running balance, print view available.",
      "Soft-delete hides customer from active list without erasing history.",
    ],
    pageSections: [
      { title: "Customer money flow", description: "Four-step guided path from add customer through statement." },
      { title: "Summary cards", description: "Total customers and total due across all customers." },
      { title: "Add/Edit panel", description: "Name, alias, contact, address, GST, opening balance." },
      { title: "Active/Deleted toggle", description: "Switch between active and archived customers." },
      { title: "Data table", description: "Searchable list with due amounts and action buttons." },
      { title: "Receive payment modal", description: "Record customer payment against their balance." },
      { title: "Statement link", description: "Opens ledger at /dashboard/customers/[id]/statement." },
    ],
    workflows: [
      {
        title: "Collect payment from customer",
        steps: [
          "Find customer in table (or Ctrl+K search).",
          "Click Receive Payment.",
          "Enter amount, mode (cash/bank), date, remark → Save.",
          "Due amount decreases; payment appears on statement and in reports.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Create customer with ₹5,000 opening balance.",
        expected: "Due shows ₹5,000; statement shows opening B/F row.",
      },
      {
        step: 2,
        action: "Record ₹2,000 cash payment.",
        expected: "Due becomes ₹3,000; ledger shows payment entry.",
      },
      {
        step: 3,
        action: "Open statement and print.",
        expected: "Letterhead, date range, ledger table with correct closing balance.",
      },
    ],
    tips: [
      "Use alias for short names on invoices.",
      "Credit invoices automatically update the ledger — no manual entry needed.",
    ],
    relatedModuleIds: ["invoices", "reports", "transactions"],
  },
  {
    id: "suppliers",
    title: "Suppliers",
    category: "commerce",
    icon: "users",
    summary: "Vendor CRM with payables, payments, and ledger statements.",
    href: "/dashboard/suppliers",
    roles: ["owner", "admin"],
    overview:
      "Suppliers mirror Customers but for money you owe. Track payables, record payments to suppliers, and view statements. Supplier bills increase payable; supplier payments decrease it.",
    howItWorks: [
      "Same CRM pattern as Customers: create, edit, soft-delete, opening balance.",
      "Supplier bills increase what you owe the supplier.",
      "Pay Supplier records cash/bank outflow. Payments of ₹5,000+ ask for confirmation.",
      "Deep link ?supplier=ID&open=pay opens the pay modal (also from Ctrl+K search).",
      "Statement shows full payable ledger with print support.",
    ],
    pageSections: [
      { title: "Summary cards", description: "Total suppliers and total payable." },
      { title: "Add/Edit panel", description: "Supplier details and opening balance." },
      { title: "Data table", description: "Payable per supplier with actions." },
      { title: "Pay modal", description: "Record payment to supplier." },
      { title: "Statement", description: "Ledger at /dashboard/suppliers/[id]/statement." },
    ],
    workflows: [
      {
        title: "Pay supplier after bill",
        steps: [
          "Record supplier bill in Supplier bills module.",
          "Open Suppliers → find vendor → Pay.",
          "Enter payment amount and mode → payable decreases.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Create supplier; add supplier bill of ₹10,000.",
        expected: "Supplier payable shows ₹10,000.",
      },
      {
        step: 2,
        action: "Pay ₹10,000 via bank.",
        expected: "Payable zero; bank/expense entries reflect payment.",
      },
    ],
    tips: ["Match supplier GST with supplier bills for GST report accuracy."],
    relatedModuleIds: ["purchases", "banks", "reports"],
  },
  {
    id: "invoices",
    title: "Invoices",
    category: "commerce",
    icon: "file-text",
    summary: "GST tax invoices with line items, split payment, and print.",
    href: "/dashboard/invoices",
    roles: ["owner", "admin"],
    overview:
      "Create professional GST tax invoices for customers. Add line items with GST slabs, link optional job/vehicle, choose payment mode (cash, bank, credit, or split), and print. Credit invoices increase customer due; paid invoices write to income and customer ledger automatically.",
    howItWorks: [
      "Select customer → add line items (description, qty, rate, GST %).",
      "Live preview shows taxable, GST, and total.",
      "Payment: full cash, full bank, full credit (due), or split cash+bank.",
      "Excess payment on split can clear older customer dues.",
      "Soft-delete reverses ledger impact.",
      "Print view at /dashboard/invoices/[id]/print.",
    ],
    pageSections: [
      { title: "Invoice form", description: "Customer, date, vehicle, line items, GST, payment mode." },
      { title: "Live totals preview", description: "Taxable, CGST/SGST, grand total, due effect." },
      { title: "Invoice table", description: "All invoices with search and edit/delete." },
      { title: "Detail & print", description: "View invoice; print-friendly layout." },
    ],
    workflows: [
      {
        title: "Invoice a completed job",
        steps: [
          "Open Invoices → New Invoice.",
          "Select customer (from job if linked).",
          "Add labour and parts line items with correct GST slab.",
          "Choose payment: credit if paying later, or cash/bank if paid now.",
          "Save → print receipt for customer.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Create ₹11,800 invoice (₹10,000 + 18% GST) on credit.",
        expected: "Customer due increases by ₹11,800; invoice in table.",
      },
      {
        step: 2,
        action: "Create paid invoice with split ₹5,000 cash + ₹5,000 bank.",
        expected: "Income recorded in both modes; customer due updated correctly.",
      },
      {
        step: 3,
        action: "Print invoice.",
        expected: "Print layout shows company letterhead, line items, GST breakdown.",
      },
    ],
    tips: [
      "Set company profile in Settings first — letterhead appears on prints.",
      "GST report pulls from these invoices — use consistent GST slabs.",
    ],
    relatedModuleIds: ["clients", "jobs", "reports", "settings"],
  },
  {
    id: "purchases",
    title: "Supplier bills",
    category: "commerce",
    icon: "shopping-cart",
    summary: "Supplier bills and credit notes.",
    href: "/dashboard/purchases",
    roles: ["owner", "admin"],
    overview:
      "Record supplier bills (parts, materials) and credit notes. Each entry updates supplier payable and feeds GST/expense reports.",
    howItWorks: [
      "Type: Supplier bill (increases payable) or Credit note (decreases payable).",
      "Select supplier, invoice number, date, taxable amount, GST slab.",
      "Total auto-calculated; remark optional.",
      "Edit or soft-delete updates supplier balance accordingly.",
    ],
    pageSections: [
      { title: "Bill form", description: "Supplier, type, invoice #, amounts, GST." },
      { title: "Bill table", description: "History with edit and delete." },
    ],
    workflows: [
      {
        title: "Record parts bill",
        steps: [
          "Select supplier.",
          "Type = Supplier bill, enter bill details and GST.",
          "Save → supplier payable increases → pay later via Suppliers.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Add supplier bill ₹5,900 (₹5,000 + GST) from supplier.",
        expected: "Supplier payable +₹5,900; entry in bill table.",
      },
      {
        step: 2,
        action: "Add credit note ₹1,000.",
        expected: "Supplier payable decreases by ₹1,000.",
      },
    ],
    tips: ["Enter supplier bills when the bill arrives — don't wait until payment."],
    relatedModuleIds: ["suppliers", "reports"],
  },
  {
    id: "transactions",
    title: "Income & Expense",
    category: "finance",
    icon: "arrow-left-right",
    summary: "Manual income and expense entries (Rojmel-style P&L).",
    href: "/dashboard/transactions",
    roles: ["owner", "admin"],
    overview:
      "Record miscellaneous income and expenses not tied to invoices or supplier bills — rent, tea, petty cash, etc. Separate from bank balances: this is your profit-and-loss view (Rojmel style). Cash and bank modes supported.",
    howItWorks: [
      "Choose Income or Expense.",
      "Enter particular (description), amount, cash or bank, date, remark.",
      "Bank mode requires selecting a bank account.",
      "Summary cards show cash/bank income, expense, and net.",
      "Delete removes the entry from reports.",
    ],
    pageSections: [
      { title: "Summary cards", description: "Cash income/expense, bank income/expense, net." },
      { title: "Help box", description: "Explains difference vs bank module." },
      { title: "New entry form", description: "Type, particular, amount, mode, bank, date." },
      { title: "Transaction table", description: "All entries with delete action." },
    ],
    workflows: [
      {
        title: "Record daily petty expense",
        steps: [
          "Type = Expense, particular = 'Tea & snacks'.",
          "Amount, Cash, today's date → Save.",
          "Shows in daily/monthly reports and reduces net.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Add ₹500 cash expense 'Shop supplies'.",
        expected: "Expense card +₹500; net decreases; row in table.",
      },
      {
        step: 2,
        action: "Add ₹1,000 bank income 'Scrap sale'.",
        expected: "Bank income increases; appears in income-expense report.",
      },
    ],
    tips: [
      "Salary payments from Payments module also flow here — avoid duplicate entries.",
      "Use this for non-invoice money movement; use Banks for account balances.",
    ],
    relatedModuleIds: ["banks", "reports", "payments"],
  },
  {
    id: "banks",
    title: "Banks",
    category: "finance",
    icon: "landmark",
    summary: "Bank accounts, balances, deposits, withdrawals, and transfers.",
    href: "/dashboard/banks",
    roles: ["owner", "admin"],
    overview:
      "Manage bank accounts with opening balances and track real account balances via deposits, withdrawals, and transfers. Each account has a statement view. Separate from Income & Expense — this tracks where money sits.",
    howItWorks: [
      "Create bank with name, A/C holder, number, IFSC, opening balance.",
      "Current balance = opening + deposits − withdrawals ± transfers.",
      "Sub-pages: Transactions (per-bank entries), Transfer (between accounts).",
      "Soft-delete archives unused accounts.",
      "Statement at /dashboard/banks/[id]/statement.",
    ],
    pageSections: [
      { title: "Summary", description: "Active bank count and total balance." },
      { title: "Quick links", description: "Bank Transactions and Transfer pages." },
      { title: "Add/Edit form", description: "Bank account details." },
      { title: "Account table", description: "Balances with statement and edit actions." },
    ],
    workflows: [
      {
        title: "Transfer between accounts",
        steps: [
          "Go to Banks → Transfer.",
          "Select from/to accounts, amount, date, remark.",
          "From balance decreases, to balance increases.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Create bank 'HDFC Current' with ₹50,000 opening.",
        expected: "Balance shows ₹50,000.",
      },
      {
        step: 2,
        action: "Deposit ₹10,000 via bank transactions page.",
        expected: "Balance ₹60,000; entry on statement.",
      },
      {
        step: 3,
        action: "Transfer ₹5,000 to second bank.",
        expected: "Both balances update; transfer rows on both statements.",
      },
    ],
    tips: ["Pick the correct bank when recording salary payments — keeps balances accurate."],
    relatedModuleIds: ["transactions", "payments", "reports"],
  },
  {
    id: "salary",
    title: "Salary",
    category: "payroll",
    icon: "dollar-sign",
    summary: "Monthly salary report from attendance — hourly or fixed monthly mode.",
    href: "/dashboard/salary",
    roles: ["owner", "admin"],
    overview:
      "Salary is calculated automatically from attendance for the selected month. Two modes (set in Settings): Hourly (adjusted hours × rate) or Fixed monthly (full/half/absent day credits). Advances are deducted; Pay button opens Payments with the suggested amount. Late after grace = half day; absent = no pay.",
    howItWorks: [
      "Pick month with the month picker — report loads for all active employees.",
      "Hourly mode: shows ₹/hr, raw hours, adjusted hours (grace/late rules), gross.",
      "Fixed mode: shows full days, half days, absent days → prorated monthly salary.",
      "Advance deduction column subtracts approved advances for that salary month.",
      "Due column = suggested pay after deductions minus already paid.",
      "Over-advanced: employee took more advance than earned — Pay button disabled.",
      "Pay → links to Payments with employee, month, and form pre-filled.",
      "Summary cards: Gross, Advance deductions, Due to pay, Total hours/day credits.",
      "Export CSV and Export Excel download the full month report (respects name search filter).",
    ],
    pageSections: [
      {
        title: "Month picker & mode badge",
        description:
          "Select YYYY-MM month. Badge shows 'Hourly' or 'Fixed monthly' and payroll rules.",
      },
      {
        title: "Search & Export",
        description: "Filter employees by name; Export CSV or Export Excel for the selected month.",
      },
      {
        title: "Summary cards",
        description: "Gross salary, advance deductions, due to pay, total hours/day credits.",
      },
      {
        title: "Employee table",
        description:
          "Per employee: attendance breakdown, gross, advances, due amount, Pay action.",
      },
      {
        title: "Pagination",
        description: "50 employees per page for large teams.",
      },
    ],
    workflows: [
      {
        title: "Monthly payroll run",
        steps: [
          "Ensure Settings → salary mode and work schedule are correct.",
          "Process all pending Requests and fix Attendance for the month.",
          "Open Salary → select the payroll month.",
          "Review each row: gross, deductions, due.",
          "Click Pay on each employee (or batch via Payments page).",
          "Verify 'Due' shows Paid or — after payment.",
        ],
      },
      {
        title: "Track an employee's earnings",
        steps: [
          "Search employee name on Salary page.",
          "Check adjusted hours (hourly) or full/half/absent days (fixed).",
          "Compare with History → This month for the same employee.",
          "Open Payments to see what was already paid this month.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Set company to Hourly mode in Settings. Add 8h workshop session for employee in target month.",
        expected:
          "Salary row shows ~8 adjusted hours; gross = hours × hourly rate.",
      },
      {
        step: 2,
        action: "Approve ₹2,000 advance for same employee and month.",
        expected: "Advance deduction −₹2,000; due = gross − advance − already paid.",
      },
      {
        step: 3,
        action: "Click Pay on employee with positive due.",
        expected:
          "Opens /dashboard/salary/payments?employee=...&month=...&openForm=1 with suggested amount.",
      },
      {
        step: 4,
        action: "Switch to Fixed mode. Employee has 20 full + 2 half + 1 absent days.",
        expected:
          "Gross prorated from monthly salary; absent days reduce pay; half days count as 0.5.",
      },
      {
        step: 5,
        action: "Employee over-advanced (advances > gross).",
        expected:
          "Due shows 'Over-advanced' warning; Pay button disabled with tooltip reason.",
      },
      {
        step: 6,
        action: "Click Export CSV then Export Excel for the month.",
        expected:
          "CSV and .xlsx files download with all employees and payroll columns for that month.",
      },
    ],
    tips: [
      "Run Salary only after attendance for the month is final.",
      "The mode badge reminds you: late after grace = half day, absent = no pay.",
      "Use History CSV export to audit rows that look wrong before paying.",
    ],
    relatedModuleIds: ["payments", "advances", "attendance", "history", "settings"],
  },
  {
    id: "payments",
    title: "Payments",
    category: "payroll",
    icon: "banknote",
    summary: "Record salary paid, advances, and deductions with payable preview.",
    href: "/dashboard/salary/payments",
    roles: ["owner", "admin"],
    overview:
      "Payments is where money actually leaves your hands for staff. Record salary paid (with auto-suggested amount from Salary calc), advances, or manual deductions. Cash/bank modes update Income & Expense. Salary Deposits (sidebar) accrue owed salary without cash movement — use Payments when you actually pay out. Supports deep links from Salary and Employee cards.",
    howItWorks: [
      "Type: Advance, Salary paid, or Deduction.",
      "Pick employee — payable preview shows earnings, advances, suggested amount.",
      "Salary paid requires salary month (YYYY-MM).",
      "Cash or bank payout; bank requires account selection.",
      "Deleting a payment reverses the financial entry.",
      "Summary: total paid, deductions, entry count.",
      "Salary paid and payments of ₹5,000+ show a confirmation dialog before saving.",
    ],
    pageSections: [
      { title: "Summary cards", description: "Total paid, deductions, number of entries." },
      {
        title: "New payment form",
        description: "Employee, type, amount, mode, bank, date, salary month, remark.",
      },
      { title: "Payable preview", description: "Live breakdown when employee + month selected." },
      { title: "Payments table", description: "History with filters and delete." },
    ],
    workflows: [
      {
        title: "Pay monthly salary from Salary page",
        steps: [
          "From Salary, click Pay on employee row.",
          "Payments opens with employee, month, and form ready.",
          "Confirm suggested amount, choose cash/bank, save.",
          "Return to Salary — row shows Paid or reduced due.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Open via Salary Pay link for employee with ₹15,000 due.",
        expected: "Form opens; payable preview shows ₹15,000 suggested.",
      },
      {
        step: 2,
        action: "Save salary paid via bank.",
        expected: "Entry in table; income/expense updated; Salary due decreases.",
      },
      {
        step: 3,
        action: "Record advance ₹3,000 for next month.",
        expected: "Shows in Advances; will deduct on that month's Salary.",
      },
    ],
    tips: [
      "Always pick the correct salary month — deductions match by month.",
      "Payable preview is your safety check before confirming amount.",
    ],
    relatedModuleIds: ["salary", "advances", "banks", "transactions"],
  },
  {
    id: "advances",
    title: "Advances",
    category: "payroll",
    icon: "wallet",
    summary: "Salary advance requests — approve, reject, and auto-deduct on payroll.",
    href: "/dashboard/advances",
    roles: ["owner", "admin"],
    overview:
      "Employees (or admins) request salary advances against a future month. Approve to commit the deduction on that month's Salary report. Reject with notes. Stats show pending count and total approved amount.",
    howItWorks: [
      "Create advance: employee, amount, salary month, reason.",
      "Pending → Approve or Reject with admin notes.",
      "Approved advances appear as deductions on Salary for that month.",
      "If advances exceed earnings, employee shows as over-advanced (no pay due).",
      "Delete removes pending/approved advance (use carefully after payroll).",
    ],
    pageSections: [
      {
        title: "Stat cards",
        description: "Pending, approved, rejected counts and total approved ₹.",
      },
      { title: "Filters", description: "Status tabs and employee search." },
      { title: "New advance form", description: "Create on behalf of employee." },
      { title: "Advance cards", description: "Each request with status and approve/reject actions." },
    ],
    workflows: [
      {
        title: "Approve employee advance request",
        steps: [
          "Filter Pending advances.",
          "Review amount and salary month.",
          "Approve with optional note.",
          "Check Salary page for that month — deduction appears.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Create ₹5,000 advance for current month.",
        expected: "Pending card +1; appears in list.",
      },
      {
        step: 2,
        action: "Approve the advance.",
        expected: "Status Approved; Salary shows −₹5,000 advance deduction.",
      },
      {
        step: 3,
        action: "Reject a different request with note.",
        expected: "Status Rejected; no salary deduction.",
      },
    ],
    tips: ["Don't approve advances for wrong month — deduction ties to salary month field."],
    relatedModuleIds: ["salary", "payments", "employees"],
  },
  {
    id: "reports",
    title: "Reports",
    category: "reports",
    icon: "bar-chart3",
    summary: "Nine financial and operational reports with print and CSV export.",
    href: "/dashboard/reports",
    roles: ["owner", "admin"],
    overview:
      "Reports index links to nine report types. Each uses a consistent layout: pick a date/period, view summary + detail table, export CSV, or print. Data comes from invoices, supplier bills, transactions, payments, and ledger entries.",
    howItWorks: [
      "Daily: single-day income, expense, net + breakdown tables.",
      "Monthly: full month book with all transactions, 5 summary cards, and previous-month comparison.",
      "Yearly: 12-month income vs expense chart/table.",
      "GST: tax collected by slab from invoices.",
      "Invoices: all tax invoices with payment split.",
      "Income-Expense: particular-wise income and expense.",
      "Expenses: expense entries only.",
      "Rojmel: full ledger with running balance (like a cash book).",
      "Balance Sheet: assets vs liabilities with opening and closing balances.",
    ],
    pageSections: [
      { title: "Reports index", description: "Grid of 9 report cards with descriptions." },
      { title: "Period filter", description: "Date, month, or range picker per report type." },
      { title: "Summary section", description: "Top-line totals for the selected period." },
      { title: "Detail table", description: "Line-by-line data backing the summary." },
      { title: "Export & Print", description: "CSV download and print-friendly view." },
    ],
    workflows: [
      {
        title: "Month-end financial review",
        steps: [
          "Run Monthly report for closing month.",
          "Cross-check GST report for tax filing.",
          "Run Rojmel for full ledger reconciliation.",
          "Export CSVs for accountant.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Create invoice and expense on same day; open Daily report for that day.",
        expected: "Income includes invoice; expense includes entry; net = difference.",
      },
      {
        step: 2,
        action: "Open GST report for current month.",
        expected: "Slab rows match sum of invoice GST amounts.",
      },
      {
        step: 3,
        action: "Export any report to CSV.",
        expected: "File downloads; row count matches on-screen table.",
      },
    ],
    tips: [
      "Daily report is best for day-end cash reconciliation.",
      "Rojmel is the master ledger — use when numbers don't match elsewhere.",
    ],
    relatedModuleIds: ["invoices", "transactions", "clients", "suppliers"],
  },
  {
    id: "settings",
    title: "Settings",
    category: "account",
    icon: "settings",
    summary: "Company profile, work schedule, salary mode, and data lock PIN.",
    href: "/dashboard/settings",
    roles: ["owner"],
    overview:
      "Owner-only company configuration. Set letterhead details for statements/invoices, work schedule (start time, grace period, daily hours, working days), salary mode (hourly vs fixed monthly), and optional data lock PIN to mask financial figures on the dashboard.",
    howItWorks: [
      "Company profile: name, tagline, address, phone, email, logo URL → used on prints.",
      "Work schedule: start time, grace minutes, daily hours, working days/month → drives hourly rate calc.",
      "Salary mode toggle: Hourly or Fixed monthly — changes Salary page columns and formulas.",
      "Data lock PIN: 4-digit PIN to hide/show money across the dashboard; auto-locks after 5 minutes idle.",
      "Quick links to Users and Password pages.",
    ],
    pageSections: [
      { title: "Quick links", description: "Dashboard Users and Change Password cards." },
      { title: "Company profile form", description: "Letterhead fields for statements and invoices." },
      { title: "Work schedule form", description: "Timing rules for attendance and hourly rate." },
      { title: "Salary mode", description: "Hourly vs Fixed monthly with explanation." },
      { title: "Data lock PIN", description: "Set, change, or remove masking PIN. Unlocked data re-locks after 5 min idle." },
    ],
    workflows: [
      {
        title: "Switch to fixed monthly payroll",
        steps: [
          "Open Settings → Salary mode → Fixed monthly.",
          "Save — employee hourly rates recalculate.",
          "Open Salary — table shows full/half/absent columns instead of hours.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Update company address and save profile.",
        expected: "Customer statement letterhead shows new address.",
      },
      {
        step: 2,
        action: "Change daily work hours from 8 to 9.",
        expected: "Employee hourly rates recalculate (lower ₹/hr for same monthly salary).",
      },
      {
        step: 3,
        action: "Set data lock PIN 1234.",
        expected: "Dashboard amounts masked until PIN entered.",
      },
    ],
    tips: [
      "Change salary mode only between months — mid-month switch confuses payroll.",
      "Example hourly calc is shown on screen when editing work schedule.",
    ],
    relatedModuleIds: ["salary", "employees", "dashboard", "users"],
  },
  {
    id: "users",
    title: "Dashboard Users",
    category: "account",
    icon: "users",
    summary: "Invite admin accounts for web dashboard access.",
    href: "/dashboard/settings/users",
    roles: ["owner"],
    overview:
      "Owners can invite additional admin users who can access the web dashboard (not mobile). Admins can manage operations but cannot access owner-only pages like Settings, Audit Log, or Billing.",
    howItWorks: [
      "Invite by email with temporary password.",
      "Admin role grants most dashboard access.",
      "Owner retains full access including financial settings.",
    ],
    pageSections: [
      { title: "User list", description: "Existing dashboard users with roles." },
      { title: "Invite form", description: "Email, name, temp password for new admin." },
    ],
    workflows: [
      {
        title: "Add workshop manager as admin",
        steps: [
          "Invite with their email.",
          "Share temp password securely.",
          "They log in at web dashboard — can manage attendance, jobs, etc.",
          "They cannot open Settings or Audit Log.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Invite admin user and log in as them.",
        expected: "Dashboard loads; Settings and Audit Log not in sidebar.",
      },
    ],
    tips: ["Use admins for daily ops; keep owner account for financial configuration."],
    relatedModuleIds: ["settings", "audit-log"],
  },
  {
    id: "audit-log",
    title: "Audit Log",
    category: "account",
    icon: "shield",
    summary: "Owner-only trail of all dashboard write actions.",
    href: "/dashboard/audit-log",
    roles: ["owner"],
    overview:
      "Every create, update, delete, payment, and transfer on the dashboard is logged with timestamp, user, action type, and human-readable summary. Filter by date range, search, and export CSV for compliance.",
    howItWorks: [
      "Automatic logging on server actions — no manual entry.",
      "Color-coded action pills (create, update, delete, pay, etc.).",
      "Date range filter narrows the table.",
      "Search matches action text and entity names.",
      "Export CSV for external archive.",
    ],
    pageSections: [
      { title: "Legend", description: "Color key for action types." },
      { title: "Date range filter", description: "From/to date pickers." },
      { title: "Search", description: "Filter log rows by keyword." },
      { title: "Log table", description: "Timestamp, user, action, entity, summary." },
      { title: "Export CSV", description: "Download filtered log." },
    ],
    workflows: [
      {
        title: "Investigate a disputed payment",
        steps: [
          "Set date range around the payment date.",
          "Search employee or client name.",
          "Find pay/delete entries with timestamps and who did it.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Create a client; open Audit Log.",
        expected: "Create entry for client with your username and timestamp.",
      },
      {
        step: 2,
        action: "Delete a transaction; refresh audit log.",
        expected: "Delete entry appears with transaction particulars in summary.",
      },
    ],
    tips: ["Check audit log if numbers changed and you don't know who changed them."],
    relatedModuleIds: ["settings", "users"],
  },
  {
    id: "password",
    title: "Change Password",
    category: "account",
    icon: "shield",
    summary: "Update your own dashboard login password.",
    href: "/dashboard/settings/password",
    roles: ["owner", "admin"],
    overview:
      "Any dashboard user can change their own password. Enter current password, new password, and confirmation.",
    howItWorks: [
      "Validates current password via Supabase auth.",
      "New password must meet minimum requirements.",
      "Success redirects or shows confirmation message.",
    ],
    pageSections: [
      { title: "Password form", description: "Current, new, and confirm password fields." },
    ],
    workflows: [
      {
        title: "Rotate password after admin leaves",
        steps: [
          "Each user opens Password page.",
          "Sets a new unique password.",
          "Old credentials no longer work.",
        ],
      },
    ],
    testing: [
      {
        step: 1,
        action: "Change password and log out.",
        expected: "New password works at login; old password rejected.",
      },
    ],
    tips: ["Change default temp passwords immediately after first login."],
    relatedModuleIds: ["users"],
  },
  {
    id: "billing",
    title: "Billing",
    category: "account",
    icon: "credit-card",
    summary: "Subscription billing — placeholder, not yet implemented.",
    href: "/dashboard/billing",
    roles: ["owner"],
    overview:
      "Billing is reserved for future Stripe subscription management. Currently shows a placeholder card only. No actions available.",
    howItWorks: ["Phase 10 (Stripe) is skipped in current build.", "Page exists as navigation placeholder."],
    pageSections: [
      { title: "Placeholder card", description: "Message that billing will be built in a future phase." },
    ],
    workflows: [],
    testing: [
      {
        step: 1,
        action: "Open /dashboard/billing as owner.",
        expected: "Placeholder message visible; no payment forms.",
      },
    ],
    tips: ["Ignore this page for now — no billing integration is active."],
    relatedModuleIds: ["settings"],
  },
];

export function getLearnModulesForRole(role: string): LearnModule[] {
  return learnModules.filter((m) => m.roles.includes(role as "owner" | "admin"));
}

export function getLearnModuleById(id: string): LearnModule | undefined {
  return learnModules.find((m) => m.id === id);
}

export function getLearnCategoriesForRole(role: string): LearnCategory[] {
  const modules = getLearnModulesForRole(role);
  const categoryIds = new Set(modules.map((m) => m.category));
  return learnCategories.filter((c) => categoryIds.has(c.id));
}