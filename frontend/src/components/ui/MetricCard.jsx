export default function MetricCard({ label, value, icon: Icon, trend, trendLabel }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
          {trend !== undefined && (
            <p className={`mt-1 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}% {trendLabel || 'vs last period'}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 bg-gray-100 rounded-md">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>
        )}
      </div>
    </div>
  )
}
