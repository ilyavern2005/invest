$('#first').on('input', calculate);
$('#percent').on('input', calculate);
$('#time').on('input', calculate);
$('#typeTime').on('change', calculate);
$('#typePercent').on('change', calculate);
$('#begin').on('change', calculate);
$('#capitalization').on('input', calculate);

$('#addTopUp').on('click', function () {
    const row = createTopUpRow();
    $('#topUps').append(row);
    row.find('.tu-date').datepicker({
        dateFormat: 'dd/mm/yy',
        defaultDate: 0
    }).datepicker('setDate', new Date());
    calculate();
});

$('#topUps').on('click', '.tu-remove', function () {
    $(this).closest('.topup-row').remove();
    calculate();
});

$('#topUps').on('input change', '.tu-sum, .tu-date, .tu-period', calculate);

$('#addWithdrawal').on('click', function () {
    const row = createWithdrawalRow();
    $('#withdrawals').append(row);
    row.find('.wd-date').datepicker({
        dateFormat: 'dd/mm/yy',
        defaultDate: 0
    }).datepicker('setDate', new Date());
    calculate();
});

$('#withdrawals').on('click', '.wd-remove', function () {
    $(this).closest('.withdrawal-row').remove();
    calculate();
});

$('#withdrawals').on('input change', '.wd-sum, .wd-date, .wd-period', calculate);

function collectTopUps() {
    const list = [];
    $('.topup-row').each(function () {
        const sum = Number($(this).find('.tu-sum').val()) || 0;
        let date = $(this).find('.tu-date').datepicker('getDate');
        const period = $(this).find('.tu-period').val();
        if (sum > 0 && date) {
            date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            list.push({ sum, date, period });
        }
    });
    return list;
}

function collectWithdrawals() {
    const list = [];
    $('.withdrawal-row').each(function () {
        const sum = Number($(this).find('.wd-sum').val()) || 0;
        let date = $(this).find('.wd-date').datepicker('getDate');
        const period = $(this).find('.wd-period').val();
        if (sum > 0 && date) {
            date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            list.push({ sum, date, period });
        }
    });
    return list;
}

function isEventDay(anchor, current, period, begin) {
    const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
    const c = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    const b = new Date(begin.getFullYear(), begin.getMonth(), begin.getDate());

    if (period === 'none') {
        return c.getTime() === a.getTime();
    }

    if (c <= b) return false;

    const diff = Math.round((c - a) / 86400000);

    switch (period) {
        case 'day':
            return c >= a;
        case 'week':
            return diff >= 0 && diff % 7 === 0;
        case 'halfmonth':
            return diff >= 0 && diff % 15 === 0;
        case 'month':
            return c >= a &&
                   (c.getDate() === a.getDate() ||
                    isLastDayOfMonth(c, a.getDate()));
        case 'year':
            return c >= a &&
                   c.getDate() === a.getDate() &&
                   c.getMonth() === a.getMonth();
    }
    return false;
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function round2(x) {
    return Math.round(x * 100) / 100;
}

function updateChart(invested, sumPercent) {
    const total = invested + sumPercent;

    let investedPct = 0;
    let percentPct = 0;

    if (total > 0) {
        investedPct = invested / total * 100;
        percentPct = sumPercent / total * 100;
    }

    const investedSeg = $('#pieInvested');
    const percentSeg = $('#piePercent');

    investedSeg.attr('stroke-dasharray', investedPct + ' ' + (100 - investedPct));
    investedSeg.attr('stroke-dashoffset', 0);

    percentSeg.attr('stroke-dasharray', percentPct + ' ' + (100 - percentPct));
    percentSeg.attr('stroke-dashoffset', -investedPct);
}

function calculate() {
    const begin = $('#begin').datepicker('getDate');
    const first = Number($('#first').val()) || 0;
    const time = Number($('#time').val()) || 0;

    if (!begin || first <= 0 || time <= 0) {
        $('#invested').text('0.00');
        $('#result').text('0.00');
        $('#sumPercent').text('0.00');
        updateChart(0, 0);
        return;
    }

    const annualPercent = (Number($('#percent').val()) || 0) / 100;
    const typeTime = $('#typeTime').val();
    const typePercent = $('#typePercent').val();
    const capitalization = $('#capitalization').prop('checked');

    let sum = first;
    let invested = first;

    const topUps = collectTopUps();
    const withdrawals = collectWithdrawals();

    const beginKey = new Date(begin.getFullYear(), begin.getMonth(), begin.getDate()).getTime();

    topUps.forEach(t => {
        if (t.period === 'none' && t.date.getTime() === beginKey) {
            sum += t.sum;
            invested += t.sum;
        }
    });

    withdrawals.forEach(w => {
        if (w.period === 'none' && w.date.getTime() === beginKey) {
            sum -= w.sum;
            invested -= w.sum;
        }
    });

    const end = new Date(begin);

    switch(typeTime) {
        case "day":
            end.setDate(end.getDate() + time);
            break;
        case "week":
            end.setDate(end.getDate() + time * 7);
            break;
        case "month":
            end.setMonth(end.getMonth() + time);
            break;
        case "year":
            end.setFullYear(end.getFullYear() + time);
            break;
    }

    const countDate = new Date(begin);
    countDate.setDate(countDate.getDate() + 1);

    let sumPercent = 0;
    let pending = 0;

    for (let i = 0; countDate <= end; i++) {
        topUps.forEach(t => {
            if (isEventDay(t.date, countDate, t.period, begin)) {
                sum += t.sum;
                invested += t.sum;
            }
        });

        withdrawals.forEach(w => {
            if (isEventDay(w.date, countDate, w.period, begin)) {
                sum -= w.sum;
                invested -= w.sum;
            }
        });

        const daysInThisYear = isLeapYear(countDate.getFullYear()) ? 366 : 365;
        pending = round2(pending + sum * (annualPercent / daysInThisYear));

        if (isPeriodEnd(begin, countDate, typePercent)) {
            sumPercent = round2(sumPercent + pending);
            if (capitalization) {
                sum = round2(sum + pending);
            }
            pending = 0;
        }

        countDate.setDate(countDate.getDate() + 1);
    }

    sumPercent = round2(sumPercent + pending);

    $('#invested').text(invested.toFixed(2));
    $('#result').text(sum.toFixed(2));
    $('#sumPercent').text(sumPercent.toFixed(2));

    updateChart(invested, sumPercent);
}

function isPeriodEnd(anchor, current, period) {
    if (current.getTime() === anchor.getTime()) return false;

    switch (period) {
        case 'day':
            return true;
        case 'week':
            return daysBetween(anchor, current) % 7 === 0;
        case 'month':
            return current.getDate() === anchor.getDate() ||
                   isLastDayOfMonth(current, anchor.getDate());
        case 'year':
            return current.getDate() === anchor.getDate() &&
                   current.getMonth() === anchor.getMonth();
    }
    return false;
}

function daysBetween(a, b) {
    const MS = 1000 * 60 * 60 * 24;
    const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((db - da) / MS);
}

function isLastDayOfMonth(d, anchorDay) {
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return anchorDay > lastDay && d.getDate() === lastDay;
}