# Shahin Motors Website Review & Dashboard Integration Plan

This document provides a detailed breakdown of all pages, modules, forms, fields, and tables from the **Shahin Motors Business Management System** (https://maturecommerceclasses.com/shahin/). Use this mapping to guide the implementation of these modules into the current Next.js dashboard.

## System Credentials & Overview
- **Live Review URL**: `https://maturecommerceclasses.com/shahin/`
- **Access ID / Contact**: `7984527398`
- **Access Password**: `7984527398`
- **Dashboard Passcode (Client-Side Lock)**: `1234` (used to toggle the financial statistics visibility on the dashboard home page).
- **Backend/Tech Stack**: PHP 8.2 (LiteSpeed Server) with MySQL and Bootstrap 3 styling.

## Modules & Navigation Structure
The system consists of the following modules accessible via the navbar:

1. **Dashboard Home**: Statistics overview, today's collections, pending dues progress bar, and client-side passcode lock.
2. **Clients**: Client list, adding clients, and viewing client statements.
3. **Suppliers**: Supplier list, adding suppliers, and recording supplier purchases (invoices).
4. **Staff Management**: Post (designations) management, staff onboarding, daily manual attendance tracking, monthly attendance reports, delete attendance, staff salary deposits, staff statements, and payment registers.
5. **Bank Operations**: Manage banks, bank-to-bank transfers, transactions, and bank statements.
6. **Reports**: GST Reports, Invoice Reports, Daily summaries (Rojmel), Monthly summaries, Yearly summaries, Income/Expense ledger reports, and specialized expense logs.
7. **Invoicing**: Complete Tax Invoice generation with client selection, vehicle details, items/materials inputs, tax rates (GST), and payment mode mapping.
8. **Income & Expenses**: General ledger entry and categories management.
9. **User Administration**: Add sub-users, view user logs, and change password.

---

## Module-by-Module Page Specifications

### 📄 home.php - SHAHIN MOTORS — Dashboard
**Section Headers / Panels**:
- *Data is locked*

**Forms**: None (Read-only or visual summary page)

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Client` | `Mode` | `Amount`

---

### 📄 manageClient.php - Manage Client
**Section Headers / Panels**:
- *+ &nbsp;New Client*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Client Name` | **Field Name**: `clientName` | **Type**: `text`
  - **Label**: `Alias Name` | **Field Name**: `clientAliasName` | **Type**: `text`
  - **Label**: `Contact` | **Field Name**: `clientContact` | **Type**: `text`
  - **Label**: `Address` | **Field Name**: `clientAddress` | **Type**: `text`
  - **Label**: `GST` | **Field Name**: `gst` | **Type**: `text`
  - **Label**: `Opening Balance` | **Field Name**: `openingBalance` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Client Name` | `Alias` | `Contact` | `Address` | `GST` | `Opening Bal.` | `Actions`

---

### 📄 clientStatement.php - Client Statement
**Section Headers / Panels**:
- *🔍 Client Statement*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Client Name` | **Field Name**: `clientName` | **Type**: `text`
  - **Label**: `Start Date` | **Field Name**: `startDate` | **Type**: `date`
  - **Label**: `End Date` | **Field Name**: `endDate` | **Type**: `date`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables**: None

---

### 📄 manageSupplier.php - Manage Supplier
**Section Headers / Panels**:
- *+ &nbsp;New Supplier*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Supplier Name` | **Field Name**: `supplierName` | **Type**: `text`
  - **Label**: `Alias Name` | **Field Name**: `supplierAliasName` | **Type**: `text`
  - **Label**: `Contact` | **Field Name**: `supplierContact` | **Type**: `text`
  - **Label**: `Address` | **Field Name**: `supplierAddress` | **Type**: `text`
  - **Label**: `GST` | **Field Name**: `supplierGST` | **Type**: `text`
  - **Label**: `Opening Balance` | **Field Name**: `openingBalance` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Supplier Name` | `Alias Name` | `Contact` | `Address` | `GST` | `Opening Balance` | `Action`

---

### 📄 purchase.php - Supplier Invoices
**Section Headers / Panels**:
- *+ &nbsp;New Invoice*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Supplier Name` | **Field Name**: `supplierId` | **Type**: `hidden`
  - **Label**: `Supplier Name` | **Field Name**: `supplierName` | **Type**: `text`
  - **Label**: `GST` | **Field Name**: `supplierGST` | **Type**: `text`
  - **Label**: `Invoice type` | **Field Name**: `invoiceType` | **Type**: `select` (Options: Purchase, Sales)
  - **Label**: `Final Amount` | **Field Name**: `finalAmount` | **Type**: `text`
  - **Label**: `5%` | **Field Name**: `txt5` | **Type**: `text`
  - **Label**: `12%` | **Field Name**: `txt12` | **Type**: `text`
  - **Label**: `18%` | **Field Name**: `txt18` | **Type**: `text`
  - **Label**: `28%` | **Field Name**: `txt28` | **Type**: `text`
  - **Label**: `Invoice No.` | **Field Name**: `invoiceNumber` | **Type**: `text`
  - **Label**: `Amount` | **Field Name**: `invoiceAmount` | **Type**: `text`
  - **Label**: `Date` | **Field Name**: `invoiceDate` | **Type**: `date`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Supplier Name` | `Invoice` | `Date` | `Purchase` | `Sales` | `User` | `Action`

---

### 📄 managePost.php - Manage Post
**Section Headers / Panels**:
- *+ &nbsp;New Post*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Post Name` | **Field Name**: `postName` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Post Name` | `Action`

---

### 📄 manageStaff.php - Manage Staff
**Section Headers / Panels**:
- *+ &nbsp;New Staff*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Staff Name` | **Field Name**: `staffName` | **Type**: `text`
  - **Label**: `Address` | **Field Name**: `staffAddress` | **Type**: `text`
  - **Label**: `Contact` | **Field Name**: `staffContact` | **Type**: `text`
  - **Label**: `Post` | **Field Name**: `postName` | **Type**: `text`
  - **Label**: `Salary` | **Field Name**: `salary` | **Type**: `text`
  - **Label**: `Joining Date` | **Field Name**: `joiningDate` | **Type**: `date`
  - **Label**: `Account No.` | **Field Name**: `accountNo` | **Type**: `text`
  - **Label**: `IFSC Code` | **Field Name**: `IFSCcode` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Staff Name` | `Contact` | `Address` | `Post` | `Salary` | `Joining Date` | `Total Duration` | `Account No.` | `IFSC Code` | `Action`

---

### 📄 staffAttendance.php - Staff Attendance
**Forms**: None (Read-only or visual summary page)

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Staff Name` | `Contact` | `Address` | `Salary`

---

### 📄 ateendanceReport.php - Attendance Report
**Section Headers / Panels**:
- *🔍 &nbsp; Attendance Report*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Staff Name` | **Field Name**: `staffName` | **Type**: `text`
  - **Label**: `Select Month` | **Field Name**: `selectMonth` | **Type**: `month`

**Data Tables**: None

---

### 📄 deleteAttendance.php - Delete Attendance
**Section Headers / Panels**:
- *&nbsp; Delete Attendance*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Select Month` | **Field Name**: `selectMonth` | **Type**: `month`

**Data Tables**: None

---

### 📄 manageStaffSalary.php - Staff Payments
**Section Headers / Panels**:
- *₹ &nbsp; Staff Payments*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Staff Name` | **Field Name**: `staffName` | **Type**: `select` (Options: ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, UMER ARODIYA, SUHEL MULLA, RINKESH MEHTA, SALMAN MIRZA, VIRAL CHOUDHRAY, RAMESH RATHOD, KEVIN S PATEL, SUFYAN DATA, TINA DHIMMER, RAJ BHAVISHKAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR)
  - **Label**: `Transcation Type` | **Field Name**: `transactionType` | **Type**: `select` (Options: Advance, Salary Paid, Salary Deduction)
  - **Label**: `Amount` | **Field Name**: `amt` | **Type**: `text`
  - **Label**: `Date` | **Field Name**: `transactionDate` | **Type**: `date`
  - **Label**: `Payment Mode` | **Field Name**: `paymentMode` | **Type**: `select` (Options: Cash, Bank)
  - **Label**: `Select Bank` | **Field Name**: `bankId` | **Type**: `select` (Options: KOTAK MAHINDRA)
  - **Label**: `Remark` | **Field Name**: `remark` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Name` | `Reason` | `Deposited Amount` | `Paid Amount` | `Salary Deduction` | `Payment Mode` | `Remark` | `Date` | `User` | `Action`

---

### 📄 salaryDeposit.php - Salary Deposit
**Section Headers / Panels**:
- *+ &nbsp; Deposite Salary*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Staff Name` | **Field Name**: `staffName` | **Type**: `select` (Options: UMER ARODIYA, SUHEL MULLA, RINKESH MEHTA, SALMAN MIRZA, VIRAL CHOUDHRAY, RAMESH RATHOD, KEVIN S PATEL, SUFYAN DATA, TINA DHIMMER, RAJ BHAVISHKAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR, ARODIYA BILAL UMAR)
  - **Label**: `Amount` | **Field Name**: `salaryAmt` | **Type**: `text`
  - **Label**: `Date` | **Field Name**: `salaryDate` | **Type**: `date`
  - **Label**: `Remark` | **Field Name**: `remark` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Staff Name` | `Amount` | `Date` | `Remark` | `User` | `Action`

---

### 📄 staffStatement.php - Staff Statement
**Section Headers / Panels**:
- *🔍 Staff Statement*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Staff Name` | **Field Name**: `staffName` | **Type**: `text`
  - **Label**: `Start Date` | **Field Name**: `startDate` | **Type**: `date`
  - **Label**: `End Date` | **Field Name**: `endDate` | **Type**: `date`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables**: None

---

### 📄 manageBank.php - Manage Banks
**Section Headers / Panels**:
- *+ &nbsp;New Bank*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Bank Name` | **Field Name**: `bankName` | **Type**: `text`
  - **Label**: `A/C Name` | **Field Name**: `acName` | **Type**: `text`
  - **Label**: `A/C Number` | **Field Name**: `acNumber` | **Type**: `text`
  - **Label**: `IFSC` | **Field Name**: `ifsc` | **Type**: `text`
  - **Label**: `Opening Balance` | **Field Name**: `openingBalance` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Bank` | `A/C Name` | `A/C Number` | `IFSC` | `Opening` | `Action`

---

### 📄 bankTransfer.php - Bank to Bank Transfer
**Section Headers / Panels**:
- *&nbsp; Bank Transfer*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `From Bank` | **Field Name**: `fromBank` | **Type**: `select` (Options: From Bank, KOTAK MAHINDRA)
  - **Label**: `To Bank` | **Field Name**: `toBank` | **Type**: `select` (Options: To Bank, KOTAK MAHINDRA)
  - **Label**: `Amount` | **Field Name**: `amount` | **Type**: `text`
  - **Label**: `transactionDate` | **Field Name**: `transactionDate` | **Type**: `date`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Bank` | `Withdraw` | `Deposit` | `Remark` | `User` | `Action`

---

### 📄 bankTransaction.php - Bank Transactions
**Section Headers / Panels**:
- *&nbsp; Bank Transactions*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Bank Name` | **Field Name**: `bankName` | **Type**: `select` (Options: KOTAK MAHINDRA)
  - **Label**: `Amount` | **Field Name**: `amount` | **Type**: `text`
  - **Label**: `Type` | **Field Name**: `transactionType` | **Type**: `select` (Options: Deposit, Withdraw)
  - **Label**: `Transaction Date` | **Field Name**: `transactionDate` | **Type**: `date`
  - **Label**: `Remark` | **Field Name**: `remark` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Bank Name` | `Amount` | `transaction Type` | `transactionDate` | `Remark` | `User` | `Action`

---

### 📄 bankStatement.php - Bank Statement
**Section Headers / Panels**:
- *🔍 Bank Statement*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Bank Name` | **Field Name**: `bankName` | **Type**: `text`
  - **Label**: `Start Date` | **Field Name**: `startDate` | **Type**: `date`
  - **Label**: `End Date` | **Field Name**: `endDate` | **Type**: `date`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables**: None

---

### 📄 GSTReport.php - Monthly Report
**Section Headers / Panels**:
- *GST Report*
- *🔍 GST Report*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Month` | **Field Name**: `start_date` | **Type**: `month`
*Form 2:*
  - **Label**: `Select Month` | **Field Name**: `start_date` | **Type**: `month`

**Data Tables**: None

---

### 📄 balanceSheet.php - Balance Sheet
**Forms & Input Fields**:
*Form 1:*
  - **Label**: `From` | **Field Name**: `firstDate` | **Type**: `date`
  - **Label**: `To` | **Field Name**: `lastDate` | **Type**: `date`

**Data Tables**: None

---

### 📄 invoiceReport.php - Invoice Report
**Forms**: None (Read-only or visual summary page)

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Client Name` | `Invoice` | `Date` | `Vehicle` | `Amount` | `Cash` | `Bank` | `Credit` | `Mode` | `User`

---

### 📄 summary.php - Summary
**Section Headers / Panels**:
- *Atiq Motors*

**Forms**: None (Read-only or visual summary page)

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `Bank` | `Cash` | `Total`
*Table 2 Columns:*
  - `#` | `Date` | `Amount` | `` | `Total` | ``
*Table 3 Columns:*
  - `Cash` | `Bank` | `Credit` | `Total`
*Table 4 Columns:*
  - `Cash` | `Bank` | `Total`
*Table 5 Columns:*
  - `Cash` | `Bank` | `Total`

---

### 📄 monthlyReport.php - Monthly Report
**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Select Month` | **Field Name**: `reportMonth` | **Type**: `month`

**Data Tables**: None

---

### 📄 yearlyReport.php - Yearly Report
**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Select Year` | **Field Name**: `reportYear` | **Type**: `select` (Options: 2026-2027, 2025-2026, 2024-2025, 2023-2024)

**Data Tables**: None

---

### 📄 particulerReport.php - Income/Expense Report
**Forms**: None (Read-only or visual summary page)

**Data Tables**: None

---

### 📄 expenseReport.php - Expense Report
**Section Headers / Panels**:
- *🔍 Income/Expense Report*

**Forms**: None (Read-only or visual summary page)

**Data Tables**: None

---

### 📄 rojmelReport.php - Manage Expense
**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Particular` | **Field Name**: `expenseName` | **Type**: `text`
  - **Label**: `Amount` | **Field Name**: `amt` | **Type**: `text`
  - **Label**: `Date` | **Field Name**: `transactionDate` | **Type**: `date`
  - **Label**: `Transaction Type` | **Field Name**: `transactionType` | **Type**: `select` (Options: Expense, Income, Transfer)
  - **Label**: `Payment Mode` | **Field Name**: `paymentMode` | **Type**: `select` (Options: Cash, Bank)
  - **Label**: `Select Bank` | **Field Name**: `bankId` | **Type**: `select` (Options: KOTAK MAHINDRA)
  - **Label**: `Remark` | **Field Name**: `remark` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`
*Form 2:*
  - **Label**: `filterDate` | **Field Name**: `filterDate` | **Type**: `hidden`
  - **Label**: `Start Date` | **Field Name**: `startDate` | **Type**: `date`
  - **Label**: `End Date` | **Field Name**: `endDate` | **Type**: `date`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Particular` | `Income` | `Expense` | `Transfer` | `Purchase` | `Mode` | `Date` | `Remark` | `User` | `Action` | `Total` | `61,800.00` | `&mdash;` | `&mdash;` | `&mdash;` | `` | `Balance` | `Income &minus; Expense = 61,800.00` | ``

---

### 📄 invoice.php - Invoices
**Section Headers / Panels**:
- *+ Invoice*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Client Name` | **Field Name**: `txtClientAlias` | **Type**: `text`
  - **Label**: `Name On Invoice` | **Field Name**: `txtClientName` | **Type**: `text`
  - **Label**: `Vehilce Number` | **Field Name**: `txtVehicle` | **Type**: `text`
  - **Label**: `GST Number` | **Field Name**: `txtGST` | **Type**: `text`
  - **Label**: `Final Amount` | **Field Name**: `txtInvoiceAmount` | **Type**: `text`
  - **Label**: `5%` | **Field Name**: `txt5` | **Type**: `text`
  - **Label**: `12%` | **Field Name**: `txt12` | **Type**: `text`
  - **Label**: `18%` | **Field Name**: `txt18` | **Type**: `text`
  - **Label**: `28%` | **Field Name**: `txt28` | **Type**: `text`
  - **Label**: `Invoice No.` | **Field Name**: `txtInvoiceNumber` | **Type**: `text`
  - **Label**: `Invoice Date` | **Field Name**: `invoiceDate` | **Type**: `date`
  - **Label**: `Payment Mode` | **Field Name**: `transactionMode` | **Type**: `select` (Options: Cash, Credit, Bank, CASH - BANK)
  - **Label**: `Bank` | **Field Name**: `selBank` | **Type**: `select` (Options: KOTAK MAHINDRA)
  - **Label**: `Cash Amount` | **Field Name**: `txtCashAmount` | **Type**: `text`
  - **Label**: `Bank Amount` | **Field Name**: `txtBankAmount` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Client Name` | `Invoice` | `Date` | `Vehicle` | `Amount` | `Cash` | `Bank` | `Credit` | `Mode` | `User` | `Action`

---

### 📄 manageExpense.php - Manage Expense
**Section Headers / Panels**:
- *+ Add Income/Expense*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Particular` | **Field Name**: `expenseName` | **Type**: `text`
  - **Label**: `Amount` | **Field Name**: `amt` | **Type**: `text`
  - **Label**: `Date` | **Field Name**: `transactionDate` | **Type**: `date`
  - **Label**: `Transcation Type` | **Field Name**: `transactionType` | **Type**: `select` (Options: Expense, Income, Transfer)
  - **Label**: `Payment Mode` | **Field Name**: `paymentMode` | **Type**: `select` (Options: Cash, Bank)
  - **Label**: `Select Bank` | **Field Name**: `bankId` | **Type**: `select` (Options: KOTAK MAHINDRA)
  - **Label**: `Remark` | **Field Name**: `remark` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Particular` | `Income` | `Expense` | `Transfer` | `Purchase` | `Mode` | `Date` | `Remark` | `User` | `Action`

---

### 📄 manageNotification.php - Manage Notification
**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Notification Title` | **Field Name**: `notificationTitle` | **Type**: `text`
  - **Label**: `Date` | **Field Name**: `notificationDate` | **Type**: `date`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Notification Title` | `Date` | `User` | `Action`

---

### 📄 manageUser.php - Manage User
**Section Headers / Panels**:
- *+ &nbsp;New User*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `User Name` | **Field Name**: `superadminName` | **Type**: `text`
  - **Label**: `Contact` | **Field Name**: `superadminContact` | **Type**: `text`
  - **Label**: `Password` | **Field Name**: `superadminPassword` | **Type**: `text`
  - **Label**: `&nbsp;` | **Field Name**: `save` | **Type**: `submit`

**Data Tables & Output Columns**:
*Table 1 Columns:*
  - `#` | `Name` | `Contact` | `Password` | `Action`

---

### 📄 userLogReport.php - User Log Report
**Forms**: None (Read-only or visual summary page)

**Data Tables**: None

---

### 📄 ChangePassword.php - Change Password
**Section Headers / Panels**:
- *Change Password*

**Forms & Input Fields**:
*Form 1:*
  - **Label**: `Old Password` | **Field Name**: `txtOldPassword` | **Type**: `password`
  - **Label**: `New Password` | **Field Name**: `txtNewPassword` | **Type**: `password`
  - **Label**: `Confirm Password` | **Field Name**: `txtConPassword` | **Type**: `password`

**Data Tables**: None

---

