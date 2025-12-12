let ganttChartInstance = null;

export function renderGantt(labels, plannedData, actualData, actualColors, today, taskStyles) {
    const ctx = document.getElementById('ganttChart').getContext('2d');

    if (ganttChartInstance) {
        ganttChartInstance.destroy();
    }

    ganttChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                // 第一層：預定進度 (背景)
                // 放在陣列第一個 = 先畫 = 在底層 = 圖例排第一個
                {
                    label: '預定進度',
                    data: plannedData,
                    
                    // ★★★ 顏色邏輯優化：三階淡灰色 ★★★
                    backgroundColor: function(context) {
                        const index = context.dataIndex;
                        const pRaw = context.raw; // 預定 [start, end]
                        if (!pRaw) return '#f4f4f4'; // 預設極淺灰

                        const pStart = pRaw[0];
                        const now = today.valueOf();
                        
                        // 取得這筆任務的「實際進度」數據
                        const actRaw = actualData[index]; // 實際 [start, end]

                        // 邏輯判斷：
                        // 1. 未來 (尚未開始)：預定開始時間 > 今天
                        if (pStart > now) {
                            return '#e8e8e8'; // 普通灰 (未來)
                        }

                        // 2. 已完成 (過去)：有實際進度 且 實際結束時間 < 今天
                        // (代表已經做完並成為歷史)
                        if (actRaw && actRaw[1] < now) {
                            return '#f8f8f8'; // 極淺灰 (已完成/過去)
                        }

                        // 3. 進行中 / 重點關注：
                        // - 正在進行 (實際結束 >= 今天)
                        // - 應開未開 (沒實際進度 且 預定開始 <= 今天)
                        return '#cccccc'; // 深灰 (調淡過的重點色)
                    },
                    
                    borderWidth: 0,
                    // ★ 嚴格維持寬度 1.3 (胖背景)
                    barPercentage: 1.3,
                    categoryPercentage: 0.7
                    // (移除 order 設定，依靠陣列順序)
                },
                
                // 第二層：實際進度 (前景)
                // 放在陣列第二個 = 後畫 = 疊在上面 = 圖例排第二個
                {
                    label: '實際進度',
                    data: actualData,
                    backgroundColor: actualColors,
                    
                    // ★ 嚴格維持寬度 0.7 (瘦前景)
                    barPercentage: 0.7,
                    categoryPercentage: 0.7
                    // (移除 order 設定)
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: { 
                        unit: 'month',
                        displayFormats: { month: 'yy/MM' } 
                    },
                    min: '2025-10-01', 
                    position: 'top',
                    grid: { color: '#f0f0f0' },
                    ticks: { 
                        font: { size: 11 },
                        maxRotation: 0,
                        autoSkip: true
                    }
                },
                y: { 
                    grid: { display: false },
                    ticks: {
                        color: function(context) {
                            const style = taskStyles[context.index];
                            return style ? style.color : '#666';
                        },
                        font: function(context) {
                            const style = taskStyles[context.index];
                            return { 
                                size: 12, 
                                weight: style ? style.weight : 'normal' 
                            };
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false }, 
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const raw = context.raw;
                            if (!raw) return '';

                            const dStart = new Date(raw[0]).toLocaleDateString();
                            let dEnd = new Date(raw[1]).toLocaleDateString();

                            if (context.datasetIndex === 1) { 
                                const color = context.dataset.backgroundColor[context.dataIndex];
                                if (color === '#ff0000') {
                                    return `${context.dataset.label}: 尚未啟動`;
                                }
                                else if (color !== '#27ae60' && color !== '#c0392b') {
                                    dEnd = "進行中";
                                }
                            }
                            return `${context.dataset.label}: ${dStart} ~ ${dEnd}`;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        todayLine: {
                            type: 'line',
                            scaleID: 'x',
                            value: today.valueOf(),
                            borderColor: '#e74c3c',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: '今日',
                                display: true,
                                position: 'start',
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                font: { size: 10 }
                            }
                        }
                    }
                }
            }
        }
    });
}
