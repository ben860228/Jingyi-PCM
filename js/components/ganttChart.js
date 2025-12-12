let ganttChartInstance = null;

export function renderGantt(labels, plannedData, actualData, actualColors, today, taskStyles) {
    const canvas = document.getElementById('ganttChart');
    const ctx = canvas.getContext('2d');

    if (ganttChartInstance) {
        ganttChartInstance.destroy();
        canvas.onclick = null;
        canvas.onmousemove = null;
    }

    const fmt = (ts) => new Date(ts).toLocaleDateString();

    ganttChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '預定進度',
                    data: plannedData,
                    backgroundColor: function(context) {
                        const index = context.dataIndex;
                        const pRaw = context.raw; 
                        if (!pRaw) return '#f4f4f4'; 

                        const pStart = pRaw[0];
                        const now = today.valueOf();
                        const actRaw = actualData[index]; 

                        if (pStart > now) return '#e8e8e8'; 
                        if (actRaw && actRaw[1] < now) return '#f8f8f8'; 
                        return '#cccccc'; 
                    },
                    borderWidth: 0,
                    barPercentage: 1.3,
                    categoryPercentage: 0.7
                },
                {
                    label: '實際進度',
                    data: actualData,
                    backgroundColor: actualColors,
                    barPercentage: 0.7,
                    categoryPercentage: 0.7
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
                    time: { unit: 'month', displayFormats: { month: 'yy/MM' } },
                    min: '2025-10-01', 
                    position: 'top',
                    grid: { color: '#f0f0f0' },
                    ticks: { font: { size: 11 }, maxRotation: 0, autoSkip: true }
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
                            return { size: 12, weight: style ? style.weight : 'normal' };
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false }, 
                
                // ★★★ 修正：把 Tooltip 加回來了！ ★★★
                tooltip: {
                    enabled: true, // 開啟內建提示
                    callbacks: {
                        label: function(context) {
                            const raw = context.raw;
                            if (!raw) return '';
                            const dStart = new Date(raw[0]).toLocaleDateString();
                            let dEnd = new Date(raw[1]).toLocaleDateString();

                            if (context.datasetIndex === 1) { 
                                const color = context.dataset.backgroundColor[context.dataIndex];
                                if (color === '#ff0000') return `${context.dataset.label}: 尚未啟動`;
                                else if (color !== '#27ae60' && color !== '#c0392b') dEnd = "進行中";
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

    // 原生 DOM 事件監聽 (處理左側文字互動)
    
    canvas.onmousemove = (e) => {
        const chart = ganttChartInstance;
        if (!chart) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // 只有滑鼠在左側文字區時變手指，在圖表區時維持預設(讓 Chart.js tooltip 運作)
        if (x <= chart.chartArea.left) {
            canvas.style.cursor = 'pointer'; 
        } else {
            canvas.style.cursor = 'default'; 
        }
    };

    canvas.onclick = (e) => {
        const chart = ganttChartInstance;
        if (!chart) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x <= chart.chartArea.left) {
            const yScale = chart.scales.y;
            const index = Math.round(yScale.getValueForPixel(y));

            if (index >= 0 && index < labels.length) {
                const taskName = labels[index];
                const pData = plannedData[index];
                const aData = actualData[index];
                const color = actualColors[index];

                const pStr = pData ? `${fmt(pData[0])} ~ ${fmt(pData[1])}` : '未定';
                let aStr = "尚未啟動";
                
                if (aData) {
                    if (color === '#ff0000') {
                        const diffTime = today.valueOf() - pData[0];
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        aStr = `尚未啟動，已落後 ${diffDays} 天`;
                    } else if (color !== '#27ae60' && color !== '#c0392b') {
                        aStr = `${fmt(aData[0])} ~ 進行中`;
                    } else {
                        aStr = `${fmt(aData[0])} ~ ${fmt(aData[1])}`;
                    }
                }

                const tipText = `【${taskName}】\n預定：${pStr}\n實際：${aStr}`;

                const overlay = document.getElementById('mobile-tooltip-overlay');
                if (overlay) {
                    overlay.textContent = tipText;
                    overlay.classList.add('show');

                    // RWD 定位
                    if (window.innerWidth > 900) {
                        overlay.style.bottom = 'auto'; 
                        overlay.style.left = (e.clientX + 15) + 'px'; 
                        overlay.style.top = (e.clientY + 15) + 'px';  
                        overlay.style.transform = 'none'; 
                    } else {
                        overlay.style.bottom = ''; 
                        overlay.style.left = ''; 
                        overlay.style.top = ''; 
                        overlay.style.transform = ''; 
                    }

                    setTimeout(() => {
                        overlay.classList.remove('show');
                    }, 3000);
                } else {
                    alert(tipText); 
                }
            }
        }
    };
}