#!/bin/bash

# pages-biz.jsx
sed -i 's/Object\.assign(window, { BizOverview, BizCustomers, BizBilling, BizInvoices, BizRevenue, BizPipeline });/export { BizOverview, BizCustomers, BizBilling, BizInvoices, BizRevenue, BizPipeline };/' pages-biz.jsx

# pages-hr.jsx
sed -i 's/Object\.assign(window, { HROverview, HRDirectory, HRRecruitment, HRLeave, HRPayroll, HRDocuments, HRPolicies, HRDepartments, HROKRs });/export { HROverview, HRDirectory, HRRecruitment, HRLeave, HRPayroll, HRDocuments, HRPolicies, HRDepartments, HROKRs };/' pages-hr.jsx

# pages-it.jsx
sed -i 's/Object\.assign(window, { ITOverview, ITDevelopment, ITInfrastructure, ITAutomation, ITMonitoring });/export { ITOverview, ITDevelopment, ITInfrastructure, ITAutomation, ITMonitoring };/' pages-it.jsx

# pages-it2.jsx
sed -i 's/Object\.assign(window, { ITIncidents, ITDeployments, ITTickets, ITSubscribers });/export { ITIncidents, ITDeployments, ITTickets, ITSubscribers };/' pages-it2.jsx

# pages-it3.jsx
sed -i 's/Object\.assign(window, { ITFabric, ITWorkloads });/export { ITFabric, ITWorkloads };/' pages-it3.jsx

# pages-settings.jsx
sed -i 's/window\.SettingsPage = SettingsPage;/export { SettingsPage };/' pages-settings.jsx

# pages-shared.jsx
sed -i 's/Object\.assign(window, { MailPage, AnnouncementsPage, HelpdeskPage, SelfServicePage, FilesPage });/export { MailPage, AnnouncementsPage, HelpdeskPage, SelfServicePage, FilesPage };/' pages-shared.jsx

echo "Fixed all page exports"
