import { DateTime } from 'luxon';

export type ViewEvent = keyof ViewCallbacks;

interface ViewCallbacks {
    inputChange: (date: DateTime) => void;
    clear: () => void;
}

export type ViewCallback<Event extends ViewEvent> = ViewCallbacks[Event];

interface Context {
    callbacks: {
        [Callback in keyof ViewCallbacks]: ViewCallbacks[Callback][];
    };
    input: {
        elements: HTMLInputElement[];
        currentIndex: number;
    };
}

export default function View() {
    const $ = {
        input: {
            date: document.querySelector('input#date') as HTMLInputElement,
            month: document.querySelector('input#month') as HTMLInputElement,
            year: document.querySelector('input#year') as HTMLInputElement
        },
        info: {
            validationMessage: document.querySelector(
                'p#validation-message'
            ) as HTMLParagraphElement
        },
        output: {
            years: document.querySelector('span#years') as HTMLSpanElement,
            months: document.querySelector('span#months') as HTMLSpanElement,
            days: document.querySelector('span#days') as HTMLSpanElement
        }
    } as const;

    const context: Context = {
        callbacks: {
            inputChange: [],
            clear: []
        },
        input: {
            currentIndex: 0,
            elements: [$.input.date, $.input.month, $.input.year]
        }
    };

    function _getContent(): [string, string, string] {
        return [
            $.input.date.value ?? '',
            $.input.month.value ?? '',
            $.input.year.value ?? ''
        ];
    }

    function _onChange(
        element: HTMLInputElement,
        options: { min: number; max: number }
    ) {
        let previousValue = element.value;
        const maxLength = String(options.max).length;

        /*
         * TODO:
         * - Add invalid state instead of snap-to-fix
         * - Backspace on next input should erase previous input (keydown)
         * - Delete on previous input should delete next input (keydown)
         */

        element.addEventListener('input', onInput);
        element.addEventListener('keydown', onKeyDown);

        function onInput(this: typeof element, event: Event) {
            const value = this.value;
            const _event = event as InputEvent;

            if (_event.data && /\D/.test(_event.data)) {
                this.value = previousValue;
                return;
            }

            /*

            if (!value && previousValue) {
                options.onInputEmptied?.callback();
            } else if (
                value &&
                options.onInputFilled &&
                options.onInputFilled.length > 0 &&
                value.length >= options.onInputFilled.length &&
                /insert/i.test(_event.inputType)
            ) {
                if (
                    options.bounds &&
                    !(
                        options.bounds.max &&
                        options.bounds.min &&
                        options.bounds.min > options.bounds.max
                    )
                ) {
                    const number = Number(value);

                    if (options.bounds.min && number < options.bounds.min) {
                        this.value = String(options.bounds.min);
                    }

                    if (options.bounds.max && number > options.bounds.max) {
                        this.value = String(options.bounds.max);
                    }
                }

                options.onInputFilled.callback();
            }

            */

            previousValue = value;

            const date = getDate();

            if (date) context.callbacks.inputChange.forEach(cb => cb(date));
        }

        function onKeyDown(this: HTMLInputElement, event: Event) {
            const value = this.value;
            const _event = event as KeyboardEvent;

            /*

            if (!value && ['Backspace', 'LeftArrow'].includes(_event.key)) {
                const clone = _cloneKeyboardEvent(_event);
                _event.preventDefault();
                options.onInputEmptied?.callback(clone);
                return;
            }

            if (
                options.bounds?.max &&
                value.length === options.bounds?.max &&
                _event.key.length === 1
            ) {
                return;
            }

            */
        }
    }

    function _updateCurrentIndex(element: HTMLInputElement) {
        element.focus();
        context.input.currentIndex = context.input.elements.indexOf(element);
    }

    function _getCurrentElement(): HTMLInputElement {
        return context.input.elements[context.input.currentIndex];
    }

    function _nextElement(): boolean {
        if (!context.input.elements[context.input.currentIndex + 1])
            return false;

        context.input.currentIndex++;
        return true;
    }

    function _prevElement(): boolean {
        if (!context.input.elements[context.input.currentIndex - 1])
            return false;

        context.input.currentIndex--;
        return true;
    }

    function _backspaceCurrentElement() {
        const element = _getCurrentElement();
        element.value = element.value.slice(0, -1);
    }

    function _deleteCurrentElement() {
        const element = _getCurrentElement();
        element.value = element.value.slice(1);
    }

    function _focus() {
        const [date, month, year] = _getContent();

        if (!date) {
            _updateCurrentIndex($.input.date);
            return;
        }

        if (!month) {
            _updateCurrentIndex($.input.month);
            return;
        }

        if (!year) {
            _updateCurrentIndex($.input.year);
            return;
        }
    }

    function clear() {
        for (const item of Object.values($.input)) {
            item.value = '';
        }

        _focus();

        context.callbacks.clear.forEach(cb => cb());
    }

    function init() {
        window.addEventListener('keydown', _clearEvent);

        _onChange($.input.date, {
            min: 1,
            max: 31
        });

        _onChange($.input.month, {
            min: 1,
            max: 12
        });

        _onChange($.input.year, {
            min: 1800,
            max: new Date().getFullYear()
        });

        _focus();

        function _clearEvent(event: KeyboardEvent) {
            if (event.key === 'Escape') clear();
        }
    }

    function getDate(): DateTime | null {
        const content = _getContent().map(Number);

        if (content.some(n => isNaN(n) || n <= 0)) return null;

        const [day, month, year] = content;

        const date = DateTime.fromObject({ year, month, day });

        if (!date.isValid) return null;

        return date;
    }

    function on<Event extends ViewEvent>(
        event: Event,
        callback: ViewCallback<Event>
    ) {
        context.callbacks[event].push(callback);
    }

    return {
        on,
        init,
        getDate,
        clear
    };
}
