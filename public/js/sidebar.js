const initCourseDropdown = () => {
    const toggle = document.getElementById("courses-toggle");
    const dropdown = document.getElementById("courses-dropdown");
    const arrow = document.getElementById("courses-arrow");

    if (toggle && dropdown && arrow) {
        if (!dropdown.classList.contains("hidden")) {
            arrow.classList.add("rotate-90");
        }

        toggle.addEventListener("click", (e) => {
            e.preventDefault();
            const isHidden = dropdown.classList.contains("hidden");
            dropdown.classList.toggle("hidden", !isHidden);
            arrow.classList.toggle("rotate-90", isHidden);
        });
    }
};

const initManagementDropdown = () => {
    const toggle = document.getElementById("management-toggle");
    const dropdown = document.getElementById("management-dropdown");
    const arrow = document.getElementById("management-arrow");

    if (toggle && dropdown && arrow) {
        if (!dropdown.classList.contains("hidden")) {
            arrow.classList.add("rotate-90");
        }

        toggle.addEventListener("click", (e) => {
            e.preventDefault();
            const isHidden = dropdown.classList.contains("hidden");
            dropdown.classList.toggle("hidden", !isHidden);
            arrow.classList.toggle("rotate-90", isHidden);
        });
    }
};

const initSidebarResize = () => {
    const sidebar = document.getElementById("sidebar");
    const resizer = document.getElementById("sidebar-resizer");
    if (!sidebar || !resizer) return;

    const MIN_WIDTH = 220;
    const MAX_WIDTH = 420;

    const saved = localStorage.getItem("so_sidebar_width");
    if (saved) sidebar.style.width = saved;

    let isDragging = false;

    resizer.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isDragging = true;
        document.body.classList.add("select-none");
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        let newWidth = e.clientX;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
        sidebar.style.width = newWidth + "px";
    });

    window.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.classList.remove("select-none");
        localStorage.setItem("so_sidebar_width", sidebar.style.width);
    });
};

initManagementDropdown();
initCourseDropdown();
initSidebarResize();
