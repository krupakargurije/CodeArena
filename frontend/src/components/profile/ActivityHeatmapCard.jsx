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
        if (count === 0) return 'dark:bg-dark-bg-tertiary bg-light-bg-tertiary';
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
        <div className="glass rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-brand-orange/10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold dark:text-dark-text-primary text-light-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Activity
                </h3>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="dark:text-dark-text-secondary text-light-text-secondary">
                            {totalSubmissions} submissions
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="dark:text-dark-text-secondary text-light-text-secondary">
                            {activeDays} active days
                        </span>
                    </div>
                </div>
            </div>

            {/* Heatmap Container */}
            <div className="overflow-x-auto">
                <div className="min-w-max">
                    {/* Month Labels */}
                    <div className="flex ml-8 mb-2">
                        {months.map((m, i) => (
                            <div
                                key={i}
                                className="text-xs dark:text-dark-text-tertiary text-light-text-tertiary"
                                style={{
                                    marginLeft: i === 0 ? `${m.index * 14}px` : `${(m.index - (months[i - 1]?.index || 0)) * 14 - 24}px`
                                }}
                            >
                                {m.month}
                            </div>
                        ))}
                    </div>

                    <div className="flex">
                        {/* Day Labels */}
                        <div className="flex flex-col gap-[2px] mr-2 text-xs dark:text-dark-text-tertiary text-light-text-tertiary">
                            {dayLabels.map((day, i) => (
                                <div key={day} className="h-3 flex items-center" style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>
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
                                            className={`w-3 h-3 rounded-sm transition-all duration-200 ${day ? getColor(day.count) : 'bg-transparent'
                                                } ${day ? 'hover:ring-2 hover:ring-brand-orange hover:ring-opacity-50 cursor-pointer' : ''}`}
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

            {/* Tooltip */}
            {hoveredDay && (
                <div className="mt-4 text-center">
                    <span className="text-sm dark:text-dark-text-secondary text-light-text-secondary">
                        <span className="font-semibold dark:text-dark-text-primary text-light-text-primary">
                            {hoveredDay.count} submission{hoveredDay.count !== 1 ? 's' : ''}
                        </span>
                        {' '}on {hoveredDay.displayDate}
                    </span>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs dark:text-dark-text-tertiary text-light-text-tertiary">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm dark:bg-dark-bg-tertiary bg-light-bg-tertiary" />
                    <div className="w-3 h-3 rounded-sm bg-green-900/50" />
                    <div className="w-3 h-3 rounded-sm bg-green-700/60" />
                    <div className="w-3 h-3 rounded-sm bg-green-500/70" />
                    <div className="w-3 h-3 rounded-sm bg-green-400" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
};

export default ActivityHeatmapCard;
