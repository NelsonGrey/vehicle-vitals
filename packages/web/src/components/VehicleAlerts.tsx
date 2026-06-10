interface MaintenanceItem {
  title: string;
  dueDate: string;
  type: string;
}

interface VehicleAlertsProps {
  items: MaintenanceItem[];
}

export const VehicleAlerts: React.FC<VehicleAlertsProps> = ({ items }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Upcoming Maintenance
      </h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>{item.title}</span>
            <span className="text-xs text-slate-500 dark:text-slate-500">
              ({item.dueDate})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
