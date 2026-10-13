function createTopUpRow() {
    return $(`
        <div class="topup-row">
            <input type="text" class="tu-sum" inputmode="decimal">
            <input type="text" class="tu-date">
            <select class="tu-period">
                <option value="none">Разово</option>
                <option value="day">Ежедневно</option>
                <option value="week">Еженедельно</option>
                <option value="halfmonth">Раз в полмесяца</option>
                <option value="month">Ежемесячно</option>
                <option value="year">Ежегодно</option>
            </select>
            <button type="button" class="tu-remove" title="Удалить">×</button>
        </div>
    `);
}

function createWithdrawalRow() {
    return $(`
        <div class="withdrawal-row">
            <input type="text" class="wd-sum" inputmode="decimal">
            <input type="text" class="wd-date">
            <select class="wd-period">
                <option value="none">Разово</option>
                <option value="day">Ежедневно</option>
                <option value="week">Еженедельно</option>
                <option value="halfmonth">Раз в полмесяца</option>
                <option value="month">Ежемесячно</option>
                <option value="year">Ежегодно</option>
            </select>
            <button type="button" class="wd-remove" title="Удалить">×</button>
        </div>
    `);
}

$('#begin').datepicker({
    dateFormat: "dd/mm/yy"
}).datepicker('setDate', new Date());

$('label[for]').on('click', function (e) {
    const target = $('#' + $(this).attr('for'));
    if (target.is('select')) {
        e.preventDefault();
        target.focus();
        try {
            if (target[0].showPicker) target[0].showPicker();
            else target.trigger('mousedown');
        } catch (err) {
            target.trigger('mousedown');
        }
    }
});

document.querySelectorAll('input[id="first"]').forEach(inp => {
    inp.addEventListener('input', function () {
        let v = this.value;

        v = v.replace(/[^0-9.,]/g, '');

        const match = v.match(/[.,]/);

        if (match) {
            const sep = match[0];
            const sepIndex = v.indexOf(sep);
            const intPart = v.slice(0, sepIndex);
            let decPart = v.slice(sepIndex + 1);

            decPart = decPart.replace(/[.,]/g, '');
            decPart = decPart.slice(0, 2);
            v = intPart + sep + decPart;
        }

        this.value = v;
    });
});