import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';

function AirQualityChart({ hourlyData }) {
  const [selectedHour, setSelectedHour] = useState(null);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-blue-500">
          <p className="font-bold text-gray-800">{data.time}</p>
          <p className="text-sm">PM2.5: <span className="font-semibold">{data.value.toFixed(1)} µg/m³</span></p>
          <p className="text-sm">AQI: <span className="font-semibold">{data.aqi}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Predicción 24 horas</h3>
        </div>
        <div className="text-xs text-gray-600">Calidad del aire esperada hoy</div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={hourlyData}
          onMouseMove={(e) => {
            if (e && e.activePayload) {
              setSelectedHour(e.activePayload[0].payload);
            }
          }}
          onMouseLeave={() => setSelectedHour(null)}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            interval={2}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            label={{ value: 'PM2.5 (µg/m³)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#colorValue)"
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.isNow) {
                return (
                  <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="white" strokeWidth={2} />
                );
              }
              return null;
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {selectedHour && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-900">
            <span className="font-semibold">{selectedHour.time}</span> - 
            PM2.5: <span className="font-bold">{selectedHour.value.toFixed(1)} µg/m³</span> | 
            AQI: <span className="font-bold">{selectedHour.aqi}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default AirQualityChart;