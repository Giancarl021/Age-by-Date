export type ViewEvent = keyof ViewCallbacks;

interface ViewCallbacks {
    inputChange: (date: Date) => void;
    clear: () => void;
}

interface OnChangeOptions {
    onInputEmptied?: {
        callback: () => void;
    };
    onInputFilled?: {
        callback: () => void;
        length: number;
    };
    bounds?: {
        min?: number;
        max?: number;
    };
}

export type ViewCallback<Event extends ViewEvent> = ViewCallbacks[Event];

export default function View() {
    const $ = {
        input: {
            date: document.querySelector('input#date') as HTMLInputElement,
            month: document.querySelector('input#month') as HTMLInputElement,
            year: document.querySelector('input#year') as HTMLInputElement
        }
    } as const;

    const callbacks: {
        [Callback in keyof ViewCallbacks]: ViewCallbacks[Callback][];
    } = {
        inputChange: [],
        clear: []
    };

    function _getContent(): [string, string, string] {
        return [
            $.input.date.value ?? '',
            $.input.month.value ?? '',
            $.input.year.value ?? ''
        ];
    }

    function _onChange(element: HTMLInputElement, options: OnChangeOptions) {
        let previousValue = element.value;

        /*
         * TODO:
         * - Add invalid state instead of snap-to-fix
         * - Backspace on next input should erase previous input (keydown)
         * - Delete on previous input should delete next input (keydown)
         * - Fire input change on any change
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

            previousValue = value;
        }

        function onKeyDown(this: HTMLInputElement, event: Event) {
            const value = this.value;
            const _event = event as KeyboardEvent;

            if (!value && _event.key === 'Backspace') {
                options.onInputEmptied?.callback();
                return;
            }

            // FIX!
            if (
                (!value ||
                    (options.onInputFilled &&
                        value.length >= options.onInputFilled.length)) &&
                _event.key === 'Delete'
            ) {
                options.onInputFilled?.callback();
                return;
            }
        }
    }

    function _focus() {
        const [date, month, year] = _getContent();

        if (!date) {
            $.input.date.focus();
            return;
        }

        if (!month) {
            $.input.month.focus();
            return;
        }

        if (!year) {
            $.input.year.focus();
            return;
        }
    }

    function clear() {
        for (const item of Object.values($.input)) {
            item.value = '';
        }

        _focus();

        callbacks.clear.forEach(cb => cb());
    }

    function init() {
        window.addEventListener('keydown', _clearEvent);

        _onChange($.input.date, {
            bounds: {
                min: 1,
                max: 31
            },
            onInputFilled: {
                length: 2,
                callback() {
                    $.input.month.focus();
                }
            },
            onInputEmptied: {
                callback() {
                    if (!$.input.month.value && !$.input.year.value) {
                        clear();
                    }
                }
            }
        });

        _onChange($.input.month, {
            bounds: {
                min: 1,
                max: 12
            },
            onInputFilled: {
                length: 2,
                callback() {
                    $.input.year.focus();
                }
            },
            onInputEmptied: {
                callback() {
                    $.input.date.focus();
                }
            }
        });

        _onChange($.input.year, {
            bounds: {
                min: 1800,
                max: new Date().getFullYear()
            },
            onInputEmptied: {
                callback() {
                    $.input.month.focus();
                }
            },
            onInputFilled: {
                length: 4,
                callback() {}
            }
        });

        _focus();

        function _clearEvent(event: KeyboardEvent) {
            if (event.key === 'Escape') clear();
        }
    }

    function getDate(): Date | null {
        return null;
    }

    function on<Event extends ViewEvent>(
        event: Event,
        callback: ViewCallback<Event>
    ) {
        callbacks[event].push(callback);
    }

    return {
        on,
        init,
        getDate,
        clear
    };
}
