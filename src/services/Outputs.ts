import { DateTime } from 'luxon';

export default function Outputs() {
    const $ = {
        container: document.querySelector('div#output') as HTMLDivElement,
        output: {
            years: document.querySelector('span#years') as HTMLSpanElement,
            months: document.querySelector('span#months') as HTMLSpanElement,
            days: document.querySelector('span#days') as HTMLSpanElement
        }
    } as const;

    function clear(): void {
        $.container.classList.add('hidden');

        for (const element of Object.values($.output)) {
            element.textContent = '';
        }
    }

    function _getDiff(date: DateTime): [string, string, string] {
        const diff = date.diffNow(['days', 'months', 'years']);

        return [diff.days, diff.months, diff.years].map(format) as [
            string,
            string,
            string
        ];

        function format(n: number) {
            return Math.abs(Math.floor(n)).toFixed(0);
        }
    }

    function setAge(date: DateTime): void {
        const [days, months, years] = _getDiff(date);

        $.output.days.textContent = days;
        $.output.years.textContent = years;
        $.output.months.textContent = months;

        $.container.classList.remove('hidden');
    }

    return {
        clear,
        setAge
    };
}
