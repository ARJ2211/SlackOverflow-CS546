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

initManagementDropdown()
initCourseDropdown()
