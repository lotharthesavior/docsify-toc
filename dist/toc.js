const defaultOptions = {
    headings: 'h1, h2',
    scope: '.markdown-section',

    // To make work
    title: 'Contents',
    listType: 'ul',

    hideInPages: [
        'Home',
    ],
}

const aTag = function (src) {
    var a = document.createElement('a')
    var content = src.firstChild.innerHTML

    // Use this to clip text w/ HTML in it.
    // https://github.com/arendjr/text-clipper
    a.innerHTML = content
    a.href = src.firstChild.href
    a.onclick = tocClick

    // In order to remove this gotta fix the styles.
    a.setAttribute('class', 'anchor')

    return a
};

const tocClick = function (e) {
    let divs = document.querySelectorAll('.page_toc .active');

    // Remove the previous classes
    [].forEach.call(divs, function (div) {
        div.setAttribute('class', 'anchor')
    });

    // Make sure this is attached to the parent not itself
    e.currentTarget.setAttribute('class', 'active')
};

const createList = function (wrapper, count) {
    while (count--) {
        if (wrapper) {
            wrapper = wrapper.appendChild(
                document.createElement('ul')
            );
        }
        if (count) {
            wrapper = wrapper.appendChild(
                document.createElement('li')
            );
        }
    }

    return wrapper;
};

//------------------------------------------------------------------------

const getHeaders = function (selector) {
    var headings2 = document.querySelectorAll(selector);
    var ret = [];

    [].forEach.call(headings2, function (heading) {
        ret = ret.concat(heading);
    });

    return ret;
};

const getLevel = function (header) {
    let decs = header.match(/\d/g);

    return decs ? Math.min.apply(null, decs) : 1;
};

const jumpBack = function (currentWrapper, offset) {
    while (offset--) {
        currentWrapper = currentWrapper.parentElement;
    }

    return currentWrapper;
};

const buildTOC = function (options) {
    var ret = document.createElement('ul')
    var wrapper = ret
    var lastLi = null
    var selector = options.scope + ' ' + options.headings
    var headers = getHeaders(selector).filter(h => h.id)

    if (options.hideInPages.indexOf(document.title) !== -1) return [];

    headers.reduce(function (prev, curr, index) {
        var currentLevel = getLevel(curr.tagName)
        var offset = currentLevel - prev

        wrapper = (offset > 0)
            ? createList(lastLi, offset)
            : jumpBack(wrapper, -offset * 2)

        wrapper = wrapper || ret

        var li = document.createElement('li')

        wrapper.appendChild(li).appendChild(aTag(curr))

        lastLi = li

        return currentLevel
    }, getLevel(options.headings))

    return ret
};

// Docsify plugin functions
function plugin(hook, vm) {
    let userOptions = vm.config.toc

    hook.mounted(function () {
        let content = window.Docsify.dom.find(".content")
        if (content) {
            let nav = window.Docsify.dom.create("aside", "")
            window.Docsify.dom.toggleClass(nav, "add", "nav")
            window.Docsify.dom.before(content, nav)
        }
    });

    hook.doneEach(function () {
        let nav = document.querySelectorAll('.nav')[0]

        if (!nav) {
            return
        }

        const toc = buildTOC(userOptions)

        // Just unset it for now.
        if (!toc.innerHTML) {
            nav.innerHTML = null
            return
        }

        // Fix me in the future
        let title = document.createElement('p')
        title.innerHTML = userOptions.title
        title.setAttribute('class', 'title')

        let container = document.createElement('div')
        container.setAttribute('class', 'page_toc')

        container.appendChild(title)
        container.appendChild(toc)

        // Existing TOC
        let tocChild = document.querySelectorAll('.nav .page_toc')

        if (tocChild.length > 0) {
            tocChild[0].parentNode.removeChild(tocChild[0])
        }

        nav.appendChild(container)
    });
}

// Docsify plugin options
window.$docsify['toc'] = Object.assign(defaultOptions, window.$docsify['toc'])
window.$docsify.plugins = [].concat(plugin, window.$docsify.plugins)
