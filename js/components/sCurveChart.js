let sCurveInstance = null;

export function renderSCurve(labels, plannedData, actualData, today) {
    // 檢查點：打開 F12 Console 若看到這行，代表檔案已更新
    console.log("✨ S-Curve 圖表程式載入成功 (v3.0 修復版)");

    const ctx = document.getElementById('sCurveChart').getContext('2d');
    
    if (sCurveInstance) {
        sCurveInstance.destroy();
    }
    
    sCurveInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: '預定進度', 
                    data: plannedData, 
                    borderColor: '#95a5a6', 
                    borderWidth: 2, 
                    pointRadius: 0, 
                    fill: false, 
                    tension: 0.4 
                },
                { 
                    label: '實際進度', 
                    data: actualData, 
                    borderColor: '#3498db', 
                    borderWidth: 3, 
                    pointRadius: 2, 
                    fill: 'start', 
                    backgroundColor: 'rgba(52, 152, 219, 0.1)', 
                    spanGaps: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                x: { 
                    type: 'time', 
                    time: { 
                        unit: 'month',
                        displayFormats: {
                            month: 'yy/MM'
                        }
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        autoSkipPadding: 20
                    },
                    grid: {
                        display: false
                    }
                }, 
                y: { 
                    min: 0, 
                    max: 100, 
                    title: { display: true, text: '累積進度 (%)' } 
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            return new Date(context[0].parsed.x).toLocaleDateString();
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) { label += context.parsed.y + '%'; }
                            return label;
                        }
                    }
                },
                legend: { position: 'bottom' },
                annotation: {
                    annotations: {
                        todayLine: {
                            type: 'line',
                            scaleID: 'x',
                            value: today.valueOf(),
                            // ★★★ 修正重點：紅虛線 + 正確的標籤語法 ★★★
                            borderColor: '#e74c3c', // 漂亮的紅色
                            borderWidth: 2,
                            borderDash: [5, 5],     // 虛線設定
                            label: {
                                content: '今日',
                                display: true,      // 3.x 版必須用 display，不能用 enabled
                                position: 'start',  // 標籤顯示在上方
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                font: { size: 10 },
                                padding: 4,
                                borderRadius: 4,
                                yAdjust: 0 
                            }
                        }
                    }
                }
            }
        }
    });
}