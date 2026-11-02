let ganttChartInstance = null;

/**
 * 甘特圖進度標籤 Plugin
 * 在每個長條右側繪製「預計XX% 實際YY% ▼差異%」
 * progressData: Array of { planned: number|null, actual: number|null }
 */
function createProgressLabelPlugin(progressData, colors) {
    return {
        id: 'ganttProgressLabels',
        afterDatasetsDraw(chart) {
            if (!progressData || progressData.length === 0) return;

            const ctx = chart.ctx;
            const chartArea = chart.chartArea;
            const xScale = chart.scales.x;

            // 根據 canvas 寬度動態決定字體大小
            const canvasWidth = chart.canvas.width;
            const fontSize = canvasWidth > 3000 ? 36 : (canvasWidth > 1500 ? 18 : 11);
            const labelPadding = canvasWidth > 3000 ? 20 : 8;

            ctx.save();

            progressData.forEach((pd, index) => {
                if (!pd) return;

                const planned = pd.planned;   // 0~100 或 null
                const actual = pd.actual;     // 0~100 或 null

                // 取得該 row 的 Y 軸中心點（用 dataset 0 的 bar 元素）
                let yCenter = null;
                const datasets = chart.data.datasets;
                for (let di = 0; di < datasets.length; di++) {
                    const meta = chart.getDatasetMeta(di);
                    if (meta && meta.data && meta.data[index]) {
                        const el = meta.data[index];
                        yCenter = el.y;
                        break;
                    }
                }
                if (yCenter === null) return;

                // 找到這個 row 的最右端（預計條 or 實際條，取較大值）
                let rightEdge = chartArea.left;
                for (let di = 0; di < datasets.length; di++) {
                    const raw = chart.data.datasets[di].data[index];
                    if (raw && raw[1]) {
                        const px = xScale.getPixelForValue(raw[1]);
                        if (px > rightEdge) rightEdge = px;
                    }
                }
                // 如果長條還沒開始或根本沒資料，只要有 planned 值就在今日線右側顯示
                if (rightEdge <= chartArea.left + 5) return;

                // 組合標籤文字
                let labelText = '';
                let diffColor = '#888888';
                let diffSymbol = '';

                const hasPlan = planned !== null && planned !== undefined;
                const hasAct  = actual  !== null && actual  !== undefined;

                if (!hasPlan && !hasAct) return;

                const pStr = hasPlan ? planned.toFixed(0) + '%' : '--';
                const aStr = hasAct  ? actual.toFixed(0)  + '%' : '--';

                if (hasPlan && hasAct) {
                    const diff = actual - planned;
                    const absDiff = Math.abs(diff).toFixed(0);
                    if (diff < -2) {
                        diffSymbol = ` ▼${absDiff}%`;
                        diffColor  = '#e74c3c';  // 落後：紅
                    } else if (diff > 2) {
                        diffSymbol = ` ▲${absDiff}%`;
                        diffColor  = '#27ae60';  // 超前：綠
                    } else {
                        diffSymbol = ' ✓';
                        diffColor  = '#27ae60';  // 符合：綠
                    }
                    // 已完成的工項（條的顏色為 #b8c5ce）用灰色顯示
                    if (colors && colors[index] === '#b8c5ce') {
                        diffColor = '#aaaaaa';
                    }
                    labelText = `預計${pStr} 實際${aStr}${diffSymbol}`;
                } else if (hasPlan) {
                    labelText = `預計${pStr}`;
                } else {
                    labelText = `實際${aStr}`;
                }

                // 繪製文字
                const x = rightEdge + labelPadding;

                // 若超出 canvas 右邊界則略過（避免被裁切）
                if (x > chart.canvas.width - labelPadding) return;

                ctx.font = `bold ${fontSize}px "Microsoft JhengHei", "Arial", sans-serif`;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';

                // 落後差異部分：分段繪製不同顏色
                if (hasPlan && hasAct) {
                    const mainText = `預計${pStr} 實際${aStr}`;
                    // 主文字（灰黑）
                    ctx.fillStyle = '#555555';
                    ctx.fillText(mainText, x, yCenter);

                    // 差異部分（彩色）
                    const mainWidth = ctx.measureText(mainText).width;
                    ctx.fillStyle = diffColor;
                    ctx.fillText(diffSymbol, x + mainWidth, yCenter);
                } else {
                    ctx.fillStyle = '#777777';
                    ctx.fillText(labelText, x, yCenter);
                }
            });

            ctx.restore();
        }
    };
}

export function renderGantt(labels, plannedData, actualData, actualColors, today, taskStyles, minDate = '2025-10-01', progressData = null) {
    const canvas = document.getElementById('ganttChart');
    const ctx = canvas.getContext('2d');

    if (ganttChartInstance) {
        ganttChartInstance.destroy();
        canvas.onclick = null;
        canvas.onmousemove = null;
    }

    const fmt = (ts) => new Date(ts).toLocaleDateString();

    // 建立進度標籤 plugin（傳入 progressData 和 actualColors 以判斷已完成顏色）
    const progressLabelPlugin = createProgressLabelPlugin(progressData, actualColors);

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

                        if (pStart > now) return '#8a8a8a'; // 尚未發生：中灰，清晰不搶眼
                        if (actRaw && actRaw[1] < now) return '#e8e8e8'; // 已完成：退場
                        return '#8a8a8a'; // 進行中：中灰
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
        plugins: [progressLabelPlugin],
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                // 右側留空間給進度標籤文字
                padding: { right: 180 }
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'month', displayFormats: { month: 'yy/MM' } },
                    min: minDate, 
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
                                else if (color !== '#b8c5ce') dEnd = "進行中"; // 已完成用新統一色
                            }

                            // ★ 若有進度資料，附加在 Tooltip 末行
                            const pd = progressData && progressData[context.dataIndex];
                            if (pd && context.datasetIndex === 1) {
                                const pStr = pd.planned !== null ? pd.planned.toFixed(0) + '%' : '--';
                                const aStr = pd.actual  !== null ? pd.actual.toFixed(0)  + '%' : '--';
                                return [
                                    `${context.dataset.label}: ${dStart} ~ ${dEnd}`,
                                    `📊 預計進度: ${pStr}  |  實際進度: ${aStr}`
                                ];
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
                    } else if (color !== '#b8c5ce') { // 已完成用新統一色
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