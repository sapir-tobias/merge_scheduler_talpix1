import SchedulerPage from './pages/Timetable/SchedulerPage';

class Category {
    constructor(name, path, pages) {
        this.name = name;
        this.path = path;
        this.pages = pages;
    }
}

class Page {
    constructor(
        name,
        path,
        component,
        allowedRoles,
        showInNavbar = true,
        isFullPath = false,
        pageProps = {}
    ) {
        this.showInNavbar = showInNavbar;
        this.isFullPath = isFullPath;
        this.component = component;
        this.allowedRoles = allowedRoles;
        this.name = name;
        this.path = path;
        this.pageProps = pageProps;
    }
}

const schedulerPages = [
    new Page('מערכת שעות', 'planner', SchedulerPage, ['Cadet', 'Sagab', 'Sagaz', 'Kamat']),
];

export const categories = [
    new Category('מערכת', 'scheduler', schedulerPages),
];

function flattenCategories(categories) {
    let pages = [];
    categories.forEach((category) => {
        category.pages.forEach((page) => {
            // Don't modify external URLs
            if (page.path && (page.path.startsWith('http://') || page.path.startsWith('https://'))) {
                // Leave external URLs as-is
            } else if (page.isFullPath) {
                page.path = `/${page.path}`;
            } else {
                page.path = `/${category.path}/${page.path}`;
            }
            pages.push(page);
        });
    });
    return pages;
}

export const allPages = flattenCategories(categories);
