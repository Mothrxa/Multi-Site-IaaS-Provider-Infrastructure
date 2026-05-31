#!/bin/bash

# icons.jsx - window.I = I;
sed -i 's/window\.I = I;/export { I };/' icons.jsx

# brand.jsx - window assignments
sed -i 's/window\.StrataLogo = StrataLogo;//' brand.jsx
sed -i 's/window\.StrataWordmark = StrataWordmark;/export { StrataLogo, StrataWordmark };/' brand.jsx

# ui.jsx - Object.assign
sed -i 's/Object\.assign(window, { Card, Stat, Pill, SectionHeader, Avatar, TabBar, Progress, KeyValue, EmptyHint, Sparkline, useLiveTime, useLiveSeries });/export { Card, Stat, Pill, SectionHeader, Avatar, TabBar, Progress, KeyValue, EmptyHint, Sparkline, useLiveTime, useLiveSeries };/' ui.jsx

# charts.jsx - Object.assign
sed -i 's/Object\.assign(window, { UptimeChart, Donut, BarChart, StackedBars, Heatmap, IncidentTimeline, MapDots, SiteMap, SpineLeafDiagram });/export { UptimeChart, Donut, BarChart, StackedBars, Heatmap, IncidentTimeline, MapDots, SiteMap, SpineLeafDiagram };/' charts.jsx

# topbar.jsx - window.TopBar
sed -i 's/window\.TopBar = TopBar;/export { TopBar };/' topbar.jsx

# sidebar.jsx - window exports
sed -i 's/window\.Sidebar = Sidebar;//' sidebar.jsx
sed -i 's/window\.DEPT_NAV = DEPT_NAV;//' sidebar.jsx
sed -i 's/window\.DEPT_INFO = DEPT_INFO;/export { Sidebar, DEPT_NAV, DEPT_INFO };/' sidebar.jsx

echo "Fixed exports in all component files"
