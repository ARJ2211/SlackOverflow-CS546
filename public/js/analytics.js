// ---- API helper ---------------------------------------------------

const fetchAnalyticsData = async (courseId, range) => {
    try {
        console.log("[Analytics] Fetching data for", { courseId, range });

        const res = await fetch(
            `/main/analytics/data?courseId=${encodeURIComponent(
                courseId
            )}&range=${encodeURIComponent(range)}`
        );

        if (!res.ok) {
            throw new Error(
                `Failed to fetch analytics data (status ${res.status})`
            );
        }

        const json = await res.json();
        console.log("[Analytics] Fetch success:", json);
        return json;
    } catch (err) {
        console.error("[Analytics] fetch error:", err);
        if (typeof showToast === "function") {
            showToast("Failed to load analytics. Please try again.", "error");
        }
        return null;
    }
};

// helper to bind / unbind unanswered button based on courseId
const setupUnansweredButton = (courseId) => {
    const btn = document.getElementById("viewUnansweredBtn");
    if (!btn) return;

    // clear old handler
    btn.onclick = null;

    if (!courseId || courseId === "all") {
        btn.disabled = true;
        btn.classList.add("opacity-50", "cursor-not-allowed");
        return;
    }

    btn.disabled = false;
    btn.classList.remove("opacity-50", "cursor-not-allowed");

    btn.onclick = () => {
        const url = `/main/courses/${courseId}/filters?status_open=open`;
        console.log("[Analytics] Navigating to unanswered list:", url);
        window.open(url, "_blank");
    };
};

// ---- Rendering helpers --------------------------------------------

const renderAllAnalytics = (payload) => {
    const analyticsContainer = document.getElementById("analyticsContainer");

    if (!analyticsContainer) {
        console.warn(
            "[Analytics] No analyticsContainer in DOM, skipping render"
        );
        return;
    }

    if (!payload || !payload.success) {
        console.warn("[Analytics] Invalid payload:", payload);
        return;
    }

    const {
        analytics,
        taAnalytics,
        taActivityByCourse,
        studentActivity,
        trendingLabels,
    } = payload;

    // Summary cards
    const totalTaCountEl = document.getElementById("totalTaCount");
    const taActiveCoursesEl = document.getElementById("taActiveCourses");
    const totalStudentCountEl = document.getElementById("totalStudentCount");
    const totalQuestionCountEl = document.getElementById("totalQuestionCount");
    const unansweredCountEl = document.getElementById("unansweredCount");
    const unansweredPercentEl = document.getElementById("unansweredPercent");
    const unansweredBarEl = document.getElementById("unansweredBar");
    const avgResponseTimeEl = document.getElementById("avgResponseTime");
    const fastestCourseEl = document.getElementById("fastestCourse");
    const slowestCourseEl = document.getElementById("slowestCourse");

    if (
        totalTaCountEl &&
        taActiveCoursesEl &&
        totalStudentCountEl &&
        totalQuestionCountEl &&
        unansweredCountEl &&
        unansweredPercentEl &&
        unansweredBarEl &&
        avgResponseTimeEl &&
        fastestCourseEl &&
        slowestCourseEl
    ) {
        totalTaCountEl.textContent = analytics.totalTaCount;
        taActiveCoursesEl.textContent = `Across ${analytics.taActiveCourses} courses`;
        totalStudentCountEl.textContent = analytics.totalStudentCount;
        totalQuestionCountEl.textContent = analytics.totalQuestionCount;
        unansweredCountEl.textContent = analytics.unansweredCount;
        unansweredPercentEl.textContent = `${analytics.unansweredPercent}% of all questions`;
        unansweredBarEl.style.width = `${analytics.unansweredPercent}%`;
        avgResponseTimeEl.textContent = analytics.avgResponseTime;
        fastestCourseEl.textContent = analytics.fastestCourse
            ? `Fastest course: ${analytics.fastestCourse.course_id} · ${analytics.fastestCourse.value}`
            : "Fastest course: —";
        slowestCourseEl.textContent = analytics.slowestCourse
            ? `Slowest course: ${analytics.slowestCourse.course_id} · ${analytics.slowestCourse.value}`
            : "Slowest course: —";
    }

    // TA analytics table
    const taBody = document.getElementById("taAnalyticsTableBody");
    if (taBody) {
        taBody.innerHTML = "";
        taAnalytics.forEach((ta) => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-gray-50";
            tr.innerHTML = `
            <td class="py-2.5 px-4">
                <div class="flex flex-col">
                    <span class="text-xs font-medium text-gray-900">${ta.name}</span>
                    <span class="text-[11px] text-gray-500">${ta.email}</span>
                </div>
            </td>
            <td class="py-2.5 px-4 text-xs">${ta.answeredCount}</td>
            <td class="py-2.5 px-4 text-xs">${ta.avgResponseTime}</td>
            <td class="py-2.5 px-4 text-xs text-gray-500">${ta.lastActive}</td>
        `;
            taBody.appendChild(tr);
        });
    }

    // TA activity per course
    const taCourseList = document.getElementById("taActivityPerCourseList");
    if (taCourseList) {
        taCourseList.innerHTML = "";
        taActivityByCourse.forEach((course) => {
            const wrapper = document.createElement("div");
            wrapper.className =
                "rounded-xl border border-gray-200 bg-[#F9FAFB] p-3";
            wrapper.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <p class="text-xs font-semibold text-gray-900">${course.course_id}</p>
                        <p class="text-[11px] text-gray-500">${course.course_name}</p>
                    </div>
                    <p class="text-[11px] text-gray-500">${course.totalQuestions} questions</p>
                </div>
            `;
            const list = document.createElement("div");
            list.className = "space-y-2 mt-2";
            course.tas.forEach((ta) => {
                const row = document.createElement("div");
                row.className = "flex items-center gap-2";
                row.innerHTML = `
                    <span class="text-[11px] text-gray-700 w-24 truncate">${ta.name}</span>
                    <div class="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div class="h-full bg-[#F0BD66]" style="width: ${ta.answersPercent}%;"></div>
                    </div>
                    <span class="text-[11px] text-gray-500 w-8 text-right">${ta.answerCount}</span>
                `;
                list.appendChild(row);
            });
            wrapper.appendChild(list);
            taCourseList.appendChild(wrapper);
        });
    }

    // Student activity
    const studentBody = document.getElementById("studentActivityTableBody");
    if (studentBody) {
        studentBody.innerHTML = "";
        studentActivity.forEach((s) => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-gray-50";
            tr.innerHTML = `
            <td class="py-2.5 px-4">
                <div class="flex flex-col">
                    <span class="text-xs font-medium text-gray-900">${s.name}</span>
                    <span class="text-[11px] text-gray-500">${s.email}</span>
                </div>
            </td>
            <td class="py-2.5 px-4 text-xs">${s.course_id}</td>
            <td class="py-2.5 px-4 text-xs">${s.questionsAsked}</td>
            <td class="py-2.5 px-4 text-xs">${s.answeredCount}</td>
            <td class="py-2.5 px-4 text-xs text-gray-500">${s.lastQuestion}</td>
        `;
            studentBody.appendChild(tr);
        });
    }

    // Trending labels
    const labelsCloud = document.getElementById("trendingLabelsCloud");
    if (labelsCloud) {
        labelsCloud.innerHTML = "";
        trendingLabels.forEach((label) => {
            const span = document.createElement("span");
            span.className =
                "inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] text-gray-800 shadow-sm";
            span.innerHTML = `
                <span class="h-1.5 w-1.5 rounded-full ${label.colorClass}"></span>
                ${label.name}
                <span class="text-[10px] text-gray-500 ml-1">· ${label.count}</span>
            `;
            labelsCloud.appendChild(span);
        });
    }
};

// ---- Init + wiring ------------------------------------------------

const initAnalyticsPage = () => {
    console.log("[Analytics] initAnalyticsPage");

    const courseFilter = document.getElementById("courseFilter");
    const timeRangeSelect = document.getElementById("timeRange");
    const refreshButton = document.getElementById("refreshAnalytics");
    const analyticsContainer = document.getElementById("analyticsContainer");
    const emptyState = document.getElementById("analyticsEmptyState");

    if (!courseFilter || !timeRangeSelect || !refreshButton) {
        console.warn("[Analytics] Missing header controls, aborting init");
        return;
    }

    const toggleViews = (hasCourseSelected) => {
        if (!analyticsContainer || !emptyState) return;
        if (hasCourseSelected) {
            analyticsContainer.classList.remove("hidden");
            emptyState.classList.add("hidden");
        } else {
            analyticsContainer.classList.add("hidden");
            emptyState.classList.remove("hidden");
        }
    };

    const doFetchAndRender = async () => {
        const courseId = courseFilter.value;
        const range = timeRangeSelect.value;

        console.log("[Analytics] doFetchAndRender", { courseId, range });

        // always update button binding even if we early-return
        setupUnansweredButton(courseId);

        if (!courseId || courseId === "all") {
            console.log("[Analytics] No course selected, skipping fetch");
            toggleViews(false);
            return;
        }

        toggleViews(true);

        const payload = await fetchAnalyticsData(courseId, range);
        if (payload) {
            renderAllAnalytics(payload);
        }
    };

    // initial: empty state and disabled button
    toggleViews(false);
    setupUnansweredButton("all");

    courseFilter.addEventListener("change", () => {
        doFetchAndRender();
    });

    timeRangeSelect.addEventListener("change", () => {
        doFetchAndRender();
    });

    refreshButton.addEventListener("click", (e) => {
        e.preventDefault();
        if (!courseFilter.value || courseFilter.value === "all") {
            if (typeof showToast === "function") {
                showToast(
                    "Please select a course to refresh analytics.",
                    "info"
                );
            }
            console.log("[Analytics] Refresh clicked with no course selected");
            return;
        }
        doFetchAndRender();
    });
};

// Outside click placeholder
const handleOutsideClick = (event) => {
    // no-op for now
};

document.addEventListener("DOMContentLoaded", initAnalyticsPage);
