/**
 * Логгирует массив. Требует, чтобы у каждого объекта в массиве был метод toString
 */
Array.prototype.log = function () {
    var len = this.length,
        str = "";

    str += '[';
    this.forEach(function (el, i) {
        str += el;
        if (i != len - 1) {
            str += ',';
        }
    });
    str += ']';

    console.log(str);
};

/**
 *
 * @param condition функция, куда поочередно передается каждый элемент массива. Если функция для элемента возвращает
 * true, то элемент удаляется
 * @returns {boolean} - был ли удален какой-нибудь элемент
 */
Array.prototype.removeElementIf = function (condition) {
    var i,
        elem,
        deleted = false;

    condition = condition.bind(this);

    for (i = 0; i < this.length;) {
        elem = this[i];
        if (condition(elem, i, this)) {
            deleted = true;
            this.splice(i, 1);
            continue;
        }
        i += 1;
    }

    return deleted;
};

/**
 * копирует свойства из одного объекта в другой с глубоким просмотром свойств
 * @param parent откуда копируются свойства
 * @param child куда копируются
 * @returns {*|Array} child
 */
function extendDeep(parent, child) {
    var i,
        toStr = Object.prototype.toString,
        astr = "[object Array]";

    child = child || ((toStr.call(parent) === astr) ? [] : {});

    for (i in parent) {
        if (parent.hasOwnProperty(i)) {
            if (typeof parent[i] === "object") {
                child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
                extendDeep(parent[i], child[i]);
            } else {
                child[i] = parent[i];
            }
        }
    }
    return child;
}

/**
 * Неглубокое сравнение двух объектов на эквивалентность
 * @param one
 * @param two
 * @returns {boolean} эквиваленты ли они?
 */
function isEqual(one, two) {
    var i;

    for (i in one) {
        if (one.hasOwnProperty(i)) {
            if (one[i] != two[i]) {
                return false;
            }
        }
    }

    return true;
}

function urlArgs() {
    var args = {};
    var query = location.search.substring(1);
    var pairs = query.split("&");
    for (var i = 0; i < pairs.length; i++) {
        var pos = pairs[i].indexOf("=");
        if (pos == -1) continue;
        var name = pairs[i].substring(0, pos);
        var value = pairs[i].substring(pos + 1);
        value = decodeURIComponent(value);
        args[name] = value;
    }
    return args;
}