/**
 * Handle removing a bookmark from a question
 * @param {string} questionId - The ID of the question to remove bookmark from
 * @param {HTMLElement} buttonElement - The button element that triggered the action
 */
const handleRemoveBookmark = async (questionId, buttonElement) => {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to remove this bookmark?');
    
    if (!confirmed) {
        return;
    }

    // Disable button and show loading state
    const originalButtonText = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = `
        <svg class="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Removing...
    `;

    try {
        const response = await fetch(`/questions/bookmarks/${questionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.status !== 200) {
            throw new Error(data.message || 'Failed to remove bookmark');
        }

        // Show success message
        showToast('Bookmark removed successfully', 'success');

        // Find the parent container and remove it from the DOM
        const bookmarkCard = buttonElement.closest('.bg-white.rounded-3xl');
        if (bookmarkCard) {
            // Add fade-out animation
            bookmarkCard.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            bookmarkCard.style.opacity = '0';
            bookmarkCard.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                bookmarkCard.remove();
                
                // Check if there are no more bookmarks
                const bookmarksContainer = document.getElementById('bookmarksContainer');
                const remainingBookmarks = bookmarksContainer.querySelectorAll('.bg-white.rounded-3xl');
                
                if (remainingBookmarks.length === 0) {
                    // Show empty state
                    bookmarksContainer.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="size-16 mb-4">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                            </svg>
                            <p class="text-lg font-medium">No bookmarks yet</p>
                            <p class="text-sm mt-2">Start bookmarking questions to see them here!</p>
                        </div>
                    `;
                }
            }, 300);
        }

    } catch (error) {
        console.error('Error removing bookmark:', error);
        showToast(error.message || 'Failed to remove bookmark. Please try again.', 'error');
        
        // Re-enable button
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalButtonText;
    }
};

/**
 * Handle outside click (placeholder for potential future use)
 * @param {Event} event - The click event
 */
const handleOutsideClick = (event) => {
    // This function can be used for closing modals or dropdowns
    // Currently a placeholder
};

