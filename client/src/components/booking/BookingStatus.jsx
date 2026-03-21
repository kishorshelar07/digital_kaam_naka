import React from 'react';

const statusConfig = {
  pending:   { label: 'प्रलंबित',   cls: 'status-pending',   icon: '⏳' },
  accepted:  { label: 'स्वीकारले', cls: 'status-accepted',  icon: '✅' },
  rejected:  { label: 'नाकारले',   cls: 'status-rejected',  icon: '❌' },
  started:   { label: 'सुरू आहे',  cls: 'status-started',   icon: '🔨' },
  completed: { label: 'पूर्ण',     cls: 'status-completed', icon: '🎉' },
  cancelled: { label: 'रद्द',      cls: 'status-cancelled', icon: '🚫' },
  disputed:  { label: 'वाद',       cls: 'status-pending',   icon: '⚖️' },
};

const BookingStatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`status-pill ${config.cls}`}>
      {config.icon} {config.label}
    </span>
  );
};

export default BookingStatusBadge;
