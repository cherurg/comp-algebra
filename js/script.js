function getGrammar(type) {
    'use strict';
    if (type === 'arithmetic') {
        return {
            priorities: {
                'MULTIPLICATION': 2,
                'PLUS': 1,
                'POWER': 3,
                'DIVISION': 2,
                'MINUS': 1,
                'OPEN': -1,
                'CLOSE': 0
            },

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
            }([
                ['*', '(\\*)', 'MULTIPLICATION'],
                ['+', '(\\+)', 'PLUS'],
                ['(', '(\\()', 'OPEN'],
                [')', '(\\))', 'CLOSE'],
                ['^', '(\\^)', 'POWER'],
                ['/', '(/)', 'DIVISION'],
                ['-', '(-)', 'MINUS']/*,
                ['_', '(_)', 'UNDERSCORE'],
                ['int', '(int)', 'INTEGRAL']*/
            ])),

            getSymbols: function () {
                return this.symbols.map(function (s) {
                    return s.symbol;
                });
            },

            initialize: function (expression) {
                var i,
                    self = this,
                    symbolsList = self.getSymbols(),
                    add;

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
                        add = Array.prototype.splice.bind(expression, i, 1);
                        //к add уже забинден конкретный объект expression, поэтому неважно к какому объекту применить
                        // apply, применяем к null, чтобы не создавать лишний объект. В качестве второго аргумента
                        // указываем массив, который вернет split. split вернет массив, который разбит по какому-то
                        // regexp, включая сам разделитель.
                        add.apply(null, expression[i].split(symbol.regexp));
                    }
                });

                expression
                    .removeElementIf(function (el) {
                        return el === "";
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
                    } else if (parseFloat(exp) == exp) {
                        o.token = 'NUMBER';
                    } else {
                        o.token = 'UNKNOWN';
                    }

                    o.priority = self.priorities[o.token];

                    o.type = o.token == 'NUMBER' || o.token == 'VAR' ? 'operand' : 'operator';

                    return o;
                });

                this.expression.forEach(function (el, i, arr) {
                    if (el.token != 'MINUS' && el.token != 'PLUS') {
                        return;
                    }

                    if (i == 0 || arr[i - 1].token == 'OPEN') {
                        el.sign = true;
                        return;
                    }
                });

                this.expression
                    .removeElementIf(function (el, i, arr) {
                        if (el.sign) {
                            arr[i + 1].value = el.value + arr[i + 1].value;
                            return true;
                        }
                    });
            }
        };
    }
}

function getTreeFromPolishNotation(notation) {
    function isChildrenLeaves(node) {
        var is = true;
        node.children
            .forEach(function (el) {
                is = is && el.type == 'operand';
            });

        return is;
    }

    var tree = {},
        n = extendDeep(notation),
        el,
        node;

    el = n.pop();
    tree.name = el.value;
    tree.parent = "null";
    tree.children = [];
    node = tree;

    function uncover1(node) {
        var children = [n.pop(), n.pop()].reverse(),
            operators = [];

        children = children.map(function (child) {
            return {
                type: child.type,
                parent: node,
                name: child.value,
                children: []
            };
        });

        children.forEach(function (child) {
            if (child.type == 'operator') {
                operators.push(child);
            }
        });

        node.children = children;

        return operators;
    }

    function formattedChild(child) {
        return {
            type: child.type,
            name: child.value,
            children: []
        };
    }

    function uncover(node) {
        var el, i, children = [];
        for (i = 0; i < 2; i += 1) {
            el = n.pop();
            if (el.type == 'operand') {
                el = formattedChild(el);
            } else if (el.type == 'operator') {
                el = formattedChild(el);
                uncover(el);
            }
            children.push(el);
        }

        children
            .reverse()
            .forEach(function (child) {
                child.parent = node;
            });

        Array.prototype.push.apply(node.children, children);
    }

    if (n.length > 0) {
        var op = uncover(node);
    }
    /*    while (op.length > 0) {
     node = op.shift();
     Array.prototype.push.apply(op, uncover(node));
     }*/
    return tree;
}

function go(string) {
    'use strict';
    var g,
        exp,
        sym,
        output,
        stack;

    g = getGrammar('arithmetic');
    // g.initialize('(a + b)/2445.3454^4');    //там происходит разложения выражения на токены, присваивание приоритетов
    // операций

    //g.initialize('d/c^(b + c)');

    g.initialize(string);
    exp = extendDeep(g.expression); //копируем получившийся массив токенов выражения

    exp.forEach(function (exp) {
        exp.toString = function () {
            var str = "{";
            str += this.value.toString() + ", ";
            str += this.token;
            str += "}";

            return str;
        };
    }); //просто определяем метод toString для каждого объекта в массиве токенов.
    exp.log(); //просто выводим в лог массив

    /*<Перевод в обратную польскую нотацию>*/
    output = [];
    stack = [];
    outer:
        while (exp.length > 0) {
            sym = exp.shift();
            if (sym.token == "UNKNOWN") {
                throw "Неизвестный токен";
                break;
            }

            if (sym.token == "NUMBER" || sym.token == "VAR") {
                output.push(sym);
                continue;
            } else if (stack.length == 0) {
                stack.push(sym);
                continue;
            }

            if (sym.token == "CLOSE") {
                while (stack[0].token != "OPEN") {
                    output.push(stack.shift());

                    if (stack.length == 0) {
                        throw "Неверная последовательность! Не обнаружена '('";
                        break outer;
                    }
                }
                stack.shift();
                continue;
            }

            if (sym.token == 'OPEN') {
                stack.unshift(sym);
                continue;
            }

            while (stack.length > 0 && stack[0].priority >= sym.priority) {
                output.push(stack.shift());
            }
            stack.unshift(sym);
        }

    while (stack.length > 0) {
        output.push(stack.shift());
    }

    output.log(); //тут хранится последовательность токенов, записанных в последовательности обратной польской нотации
    stack.log(); //должен быть пуст
    /*</Перевод в обратную польскую нотацию>*/

    var tree = [getTreeFromPolishNotation(output)];
    draw(tree, "#tree");
}

$("#start").on("click", function () {
    try {
        go($("#query").val())
    } catch (err) {
        alert("Ошибка! Больше информации в консоли.");
        console.log(err);
    }
});