function getGrammar(type) {
    if (type === 'arithmetic') {
        return {
            symbols: (function (arr) {
                var symbols = [],
                    o;
                arr.forEach(function (el) {
                    o = {};
                    o.symbol = el[0];
                    o.regexp = new RegExp(el[1]);
                    o.tokenName = el[2] || "UNKNOWN";
                    symbols.push(o);
                });

                return symbols;
            })([
                ['*', '(\\*)', 'MULT'],
                ['+', '(\\+)', 'PLUS'],
                ['(', '(\\()', 'OPEN'],
                [')', '(\\))', 'CLOSE'],
                ['^', '(\\^)', 'POWER'],
                ['/', '(/)', 'DIV'],
                ['-', '(-)', 'MINUS'],
                ['_', '(_)', 'USCORE'],
                ['int', '(int)', 'INTGRL']
            ]),

            getSymbols: function () {
                return this.symbols.map(function (s) {
                    return s.symbol;
                });
            },

            initialize: function (expression) {
                var i,
                    self = this,
                    symbolsList = self.getSymbols();

                //переводим выражение в форму массива, заодно удаляя пробелы
                expression = [expression.replace(/\s+/g, '')];

                //идем по каждому известному токену
                this.symbols.forEach(function (symbol) {

                    //идем по всем элементам, которые содержатся в массиве expression и разбиваем их по нужному токену
                    // symbol. В итоге массив дробится на все более мелкие и мелкие части, пока там не останутся только:
                    // 1. Токены
                    // 2. Числа
                    // 3. Перменные
                    // 4. Неизвестные данные
                    for (i = expression.length - 1; i >= 0; i -= 1) {
                        //эта конструкция нужна, чтобы вместо массива, который возвращает split положить в expression
                        // элементы, которые содержит в себе split.
                        // add - каррированный splice для expression, который удаляет 1 элемент на i-ом месте
                        var add = Array.prototype.splice.bind(expression, i, 1);
                        //к add уже забинден конкретный объект expression, поэтому неважно к какому объекту применить
                        // apply, применяем к null, чтобы не создавать лишний объект. В качестве второго аргумента
                        // указываем массив, который вернет split. split вернет массив, который разбит по какому-то
                        // regexp, включая сам разделитель.
                        add.apply(null, expression[i].split(symbol.regexp));
                    }
                });

                this.expression = expression.map(function (exp) {
                    var o,
                        index;

                    o = {
                        value: exp
                    };
                    index = symbolsList.indexOf(exp);

                    if (index !== -1) {
                        o.token = self.symbols[index].tokenName;
                    } else if (/^([a-z]|[A-Z])+(\d)*$/.test(exp)) {
                        o.token = 'VAR';
                    } else if (parseFloat(exp).toString() === exp) {
                        o.token = 'NUMBER';
                    } else {
                        o.token = 'UNKNOWN';
                    }

                    return o;
                });
            }
        }
    }
}

var g = getGrammar('arithmetic');
g.initialize('a + b+c*100500');
console.log("got it");