import { DateTime } from 'luxon';

export type ViewEvent = keyof ViewCallbacks;

interface ViewCallbacks {
    inputChange: (date: DateTime) => void;
    clear: () => void;
}

export type ViewCallback<Event extends ViewEvent> = ViewCallbacks[Event];

interface ValidationError {
    lessThanMininum: boolean;
    greaterThanMaximum: boolean;
}

interface Context {
    callbacks: {
        [Callback in keyof ViewCallbacks]: ViewCallbacks[Callback][];
    };
    input: {
        elements: HTMLInputElement[];
        currentIndex: number;
    };
    validationErrors: {
        elements: Record<string, ValidationError>;
        general: boolean;
    };
}

export default function Inputs() {
    const $ = {
        input: {
            date: document.querySelector('input#date') as HTMLInputElement,
            month: document.querySelector('input#month') as HTMLInputElement,
            year: document.querySelector('input#year') as HTMLInputElement
        },
        info: {
            validationErrors: document.querySelector(
                'ul#validation-errors'
            ) as HTMLParagraphElement
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
        },
        validationErrors: {
            elements: {
                [$.input.date.id]: {
                    greaterThanMaximum: false,
                    lessThanMininum: false
                },
                [$.input.month.id]: {
                    greaterThanMaximum: false,
                    lessThanMininum: false
                },
                [$.input.year.id]: {
                    greaterThanMaximum: false,
                    lessThanMininum: false
                }
            },
            general: false
        }
    };

    function _getContent(): [string, string, string] {
        return [
            $.input.date.value ?? '',
            $.input.month.value ?? '',
            $.input.year.value ?? ''
        ];
    }

    function _hasValidationError(): boolean {
        if (context.validationErrors.general) return true;

        for (const element of Object.values(context.validationErrors.elements))
            if (element.greaterThanMaximum || element.lessThanMininum)
                return true;

        return false;
    }

    function _getValidationErrorMessages(): string[] {
        const messages: string[] = [];
        if (context.validationErrors.general) {
            messages.push('A data informada não está válida');
        }

        for (const elementId in context.validationErrors.elements) {
            const element = document.getElementById(
                elementId
            ) as HTMLInputElement;

            const displayName =
                element.getAttribute('data-display-name') ?? elementId;

            const validationErrors =
                context.validationErrors.elements[elementId];

            if (validationErrors.lessThanMininum) {
                messages.push(
                    `O campo ${displayName} está abaixo do valor mínimo (${element.min})`
                );
            }

            if (validationErrors.greaterThanMaximum) {
                messages.push(
                    `O campo ${displayName} está acima do valor máximo (${element.max})`
                );
            }
        }

        return messages;
    }

    function _onChange(
        element: HTMLInputElement,
        options: { min: number; max: number }
    ) {
        let previousValue = element.value;
        const maxLength = String(options.max).length;

        element.min = String(options.min);
        element.max = String(options.max);
        element.setAttribute('data-max-length', String(maxLength));

        element.addEventListener('input', onInput);
        element.addEventListener('keydown', onKeyDown);
        element.addEventListener('focus', onFocus);

        function onFocus(this: HTMLInputElement) {
            _updateCurrentIndex(this);
        }

        function onInput(this: HTMLInputElement, event: Event) {
            const value = this.value;
            const valueAsNumber = Number(this.value);
            const _event = event as InputEvent;

            if (_event.data && /\D/.test(_event.data)) {
                this.value = previousValue;
                return;
            }

            if (!value && previousValue) _prevElement();
            else if (
                value &&
                value.length >= maxLength &&
                /insert/i.test(_event.inputType)
            )
                _nextElement();

            context.validationErrors.elements[element.id].lessThanMininum =
                valueAsNumber < options.min;

            context.validationErrors.elements[element.id].greaterThanMaximum =
                valueAsNumber > options.max;

            previousValue = value;

            _updateState();
        }

        function onKeyDown(this: HTMLInputElement, event: Event) {
            const value = this.value;
            const _event = event as KeyboardEvent;

            const selection = {
                selecting: this.selectionStart !== this.selectionEnd,
                atStart: this.selectionStart === 0,
                atEnd: this.selectionStart === value.length
            };

            const toBeValue =
                value + (_event.key.length === 1 ? _event.key : '');

            if (toBeValue.length > maxLength && !selection.selecting) {
                _event.preventDefault();
                if (_nextElement()) _insertOnCurrentElement(_event.key);
                return;
            }

            switch (_event.key) {
                case 'LeftArrow':
                    if (!selection.selecting && selection.atStart) {
                        _event.preventDefault();
                        _prevElement();
                    }
                    break;
                case 'RightArrow':
                    if (!selection.selecting && selection.atEnd) {
                        _event.preventDefault();
                        _nextElement();
                    }
                    break;
                case 'Backspace':
                    if (!selection.selecting && selection.atStart) {
                        _event.preventDefault();
                        if (_prevElement()) _backspaceOnCurrentElement();
                    }
                    break;
                case 'Delete':
                    if (!selection.selecting && selection.atEnd) {
                        _event.preventDefault();
                        if (_nextElement()) _deleteOnCurrentElement();
                    }
                    break;
            }
        }
    }

    function _updateState() {
        const date = getDate();

        if (date) {
            context.callbacks.inputChange.forEach(cb => cb(date));
            $.info.validationErrors.classList.add('hidden');
        } else if (_hasValidationError()) {
            const messages = _getValidationErrorMessages();

            const htmlParts: string[] = [];

            for (const message of messages) {
                const element = document.createElement('li');
                element.textContent = message;

                htmlParts.push(element.outerHTML);
            }

            $.info.validationErrors.innerHTML = htmlParts.join('');
            $.info.validationErrors.classList.remove('hidden');
        } else {
            $.info.validationErrors.classList.add('hidden');
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
        _getCurrentElement().focus();
        return true;
    }

    function _prevElement(): boolean {
        if (!context.input.elements[context.input.currentIndex - 1])
            return false;

        context.input.currentIndex--;
        _getCurrentElement().focus();
        return true;
    }

    function _backspaceOnCurrentElement() {
        const element = _getCurrentElement();
        element.value = element.value.slice(0, -1);
    }

    function _deleteOnCurrentElement() {
        const element = _getCurrentElement();
        element.value = element.value.slice(1);
    }

    function _insertOnCurrentElement(data: string) {
        if (data.length > 1) return;

        const element = _getCurrentElement();
        const maxLength = zeroOrPositive(
            Number(element.getAttribute('data-max-length') ?? 0)
        );

        if (element.value.length === maxLength) return;

        element.value += data;

        function zeroOrPositive(n: number) {
            return n < 0 ? 0 : n;
        }
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

        $.info.validationErrors.classList.add('hidden');

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

        context.validationErrors.general = !date.isValid;

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
