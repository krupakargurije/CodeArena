import { useMemo, useState } from 'react';

const ActivityHeatmapCard = ({ submissions = [] }) => {
    const [hoveredDay, setHoveredDay] = useState(null);

    // Generate last 365 days of activity data
    const activityData = useMemo(() => {
        const today = new Date();
        const days = [];

        // Create a map of submission counts by date
        const submissionMap = {};
        submissions.forEach(s => {
            const date = new Date(s.submittedAt || s.createdAt);
            const dateStr = date.toISOString().split('T')[0];
            submissionMap[dateStr] = (submissionMap[dateStr] || 0) + 1;
        });

        // Generate last 365 days
        for (let i = 364; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                count: submissionMap[dateStr] || 0,
                dayOfWeek: date.getDay(),
                month: date.getMonth(),
                displayDate: date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
            });
        }

        return days;
    }, [submissions]);

    // Group days into weeks
    const weeks = useMemo(() => {
        const result = [];
        let currentWeek = [];

        // Add empty cells for the first week if needed
        const firstDayOfWeek = activityData[0]?.dayOfWeek || 0;
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push(null);
        }

        activityData.forEach((day) => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                result.push(currentWeek);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            result.push(currentWeek);
        }

        return result;
    }, [activityData]);

    // Get months for labels
    const months = useMemo(() => {
        const result = [];
        let currentMonth = -1;
        let weekIndex = 0;

        weeks.forEach((week, index) => {
            const validDay = week.find(d => d !== null);
            if (validDay && validDay.month !== currentMonth) {
                currentMonth = validDay.month;
                result.push({
                    month: new Date(validDay.date).toLocaleDateString('en-US', { month: 'short' }),
                    index: index
                });
            }
        });

        return result;
    }, [weeks]);

    // Get color based on count
    const getColor = (count) => {
        if (count === 0) return 'bg-dark-bg-tertiary';
        if (count === 1) return 'bg-green-900/50';
        if (count <= 3) return 'bg-green-700/60';
        if (count <= 5) return 'bg-green-500/70';
        return 'bg-green-400';
    };

    // Calculate total submissions
    const totalSubmissions = activityData.reduce((acc, d) => acc + d.count, 0);
    const activeDays = activityData.filter(d => d.count > 0).length;

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-[#12121a]/80 backdrop-blur-xl rounded-xl p-6 border border-white/5 h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-medium text-dark-text-secondary flex items-center gap-2 uppercase tracking-wider text-xs">
                    <svg className="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Activity
                </h3>
                <div className="flex items-center gap-4 text-xs font-medium bg-white/[0.02] border border-white/5 px-3 py-1 rounded-lg">
                    <span className="text-white">
                        {totalSubmissions} <span className="text-dark-text-tertiary font-normal">submissions</span>
                    </span>
                    <span className="w-px h-3 bg-white/10" />
                    <span className="text-white">
                        {activeDays} <span className="text-dark-text-tertiary font-normal">active days</span>
                    </span>
                </div>
            </div>

            {/* Heatmap Container */}
            <div className="overflow-x-auto pb-2">
                <div className="min-w-max">
                    {/* Month Labels */}
                    <div className="flex ml-8 mb-2">
                        {months.map((m, i) => (
                            <div
                                key={i}
                                className="text-[10px] uppercase tracking-wider text-dark-text-tertiary font-medium"
                                style={{
                                    marginLeft: i === 0 ? `${m.index * 13}px` : `${(m.index - (months[i - 1]?.index || 0)) * 13 - 20}px`
                                }}
                            >
                                {m.month}
                            </div>
                        ))}
                    </div>

                    <div className="flex">
                        {/* Day Labels */}
                        <div className="flex flex-col gap-[3px] mr-3 text-[10px] text-dark-text-tertiary font-medium pt-[1px]">
                            {dayLabels.map((day, i) => (
                                <div key={day} className="h-2.5 flex items-center" style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="flex gap-[3px]">
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-[3px]">
                                    {week.map((day, dayIndex) => (
                                        <div
                                            key={dayIndex}
                                            className={`
                                                w-2.5 h-2.5 rounded-[2px] transition-all duration-300
                                                ${day ? getColor(day.count) : 'bg-transparent'}
                                                ${day ? 'hover:scale-125 hover:z-10 hover:shadow-lg hover:shadow-green-500/20 cursor-pointer' : ''}
                                            `}
                                            onMouseEnter={() => day && setHoveredDay(day)}
                                            onMouseLeave={() => setHoveredDay(null)}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer: Tooltip & Legend */}
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-white/5 h-10">
                {/* Tooltip */}
                <div className="transition-all duration-300">
                    {hoveredDay ? (
                        <div className="text-xs text-dark-text-secondary animate-in fade-in slide-in-from-bottom-1">
                            <span className="font-bold text-white">
                                {hoveredDay.count} submission{hoveredDay.count !== 1 ? 's' : ''}
                            </span>
                            {' '}on <span className="text-dark-text-tertiary">{hoveredDay.displayDate}</span>
                        </div>
                    ) : (
                        <span className="text-xs text-dark-text-tertiary italic">
                            Hover over a square to view details
                        </span>
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 text-[10px] text-dark-text-tertiary font-medium uppercase tracking-wider">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-dark-bg-tertiary" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-green-900/40" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-green-700/50" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-green-500/60" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-green-400" />
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};

export default ActivityHeatmapCard;
