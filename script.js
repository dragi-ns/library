(function IIFE() {
    const BOOKS_DEMO = [
        new Book('Anna Karenina', 'Leo Tolstoy', 864, true),
        new Book('Madame Bovary', 'Gustave Flaubert', 432, false),
        new Book('War and Peace', 'Leo Tolstoy', 1296, true),
        new Book('The Great Gatsby', 'F. Scott Fitzgerald', 180, true),
        new Book('Lolita', 'Vladimir Nabokov', 317, false),
        new Book('Middlemarch', 'George Eliot', 880, false),
        new Book('The Adventures of Huckleberry Finn', 'Mark Twain', 330, true),
        new Book('The Stories of Anton Chekhov ', 'Anton Chekhov', 496, false),
        new Book('In Search of Lost Time', 'Marcel Proust', 468, false),
        new Book('Hamlet', 'William Shakespeare', 342, true)
    ];
    const VALID_FILTERS = [
        'all', 'read', 'not-read'
    ];
    const NO_BOOKS_MSGS = Object.freeze({
        'all': 'There are no books currently in the library... Fancy to add some?',
        'read': 'Maybe you should read some books?',
        'not-read': 'Whoa, whoa, whoa! Take it easy there, champ. You have read ALL the books!'
    });

    const root = document.documentElement;
    if (localStorage.getItem('color-mode')) {
        root.dataset.colorMode = localStorage.getItem('color-mode');
    }

    const colorModeButton = document.querySelector('#color-mode');
    colorModeButton.addEventListener('click', toggleColorMode);

    const filters = document.querySelectorAll('.right-actions .filter');
    filters.forEach((filter) => {
        filter.addEventListener('click', filterBooks);
    });

    let books = [];
    if (localStorage.getItem('books')) {
        loadBooksFromLocalStorage();
    }

    const loadDemoDataButton = document.querySelector('#load-demo-data');
    loadDemoDataButton.addEventListener('click', loadDemoBooks);

    let activeFilter = localStorage.getItem('filter') ?? 'all';
    const activeFilterButton = document.querySelector(
        `.filter[data-filter='${activeFilter}']`
    );
    if (activeFilterButton) {
        activeFilterButton.classList.add('active');
    }

    const newBookButton = document.querySelector('#new-book');
    const addBookModal = document.querySelector('#add-book-modal');
    const addBookForm = document.querySelector('#add-book-form');
    const cancelButton = document.querySelector('#cancel-button');
    newBookButton.addEventListener('click', openAddBookModal);
    cancelButton.addEventListener('click', closeAddBookModal);
    addBookModal.addEventListener('click', (event) => {
        if (event.target.id === addBookModal.id) {
            closeAddBookModal();
        }
    });
    addBookForm.addEventListener('submit', handleAddBookFormSubmission);

    const bookCount = document.querySelector('#book-count');
    const booksContainer = document.querySelector('.books');
    const noBooks = document.querySelector('#no-books');
    createBookElements();
    displayBookElements();

    function Book(title, author, numPages, isRead, id = null) {
        this.id = id ?? generateID();
        this.title = title;
        this.author = author;
        this.numPages = numPages;
        this.isRead = isRead;
        Object.defineProperties(this, {
            _element: {
                value: null,
                writable: true,
                enumerable: false
            },
            element: {
                get() { return this._element; },
                set(newElement) {
                    if (this._element) {
                        this._element.remove();
                    }
                    this._element = newElement;
                },
                enumerable: false
            }
        });
    }

    Book.prototype.toggleIsRead = function toggleIsRead() {
        this.isRead = !this.isRead;
        this.updateReadButton();
    };

    Book.prototype.updateReadButton = function updateReadButton() {
        if (!this.element) {
            return;
        }
        const readButtonIcon = this.element.querySelector('.read-button span:first-child i');
        const readButtonText = this.element.querySelector('.read-button span:last-child');
        if (!readButtonIcon || !readButtonText) {
            return;
        }

        const [iconClassName, text] = getBookElementActionReadButtonContent(this.isRead);
        readButtonIcon.className = iconClassName;
        readButtonText.textContent = text;
    };

    function generateID() {
        // https://dev.to/coderkearns/comment/lm99
        return Math.floor(Math.random() * Date.now());
    }

    function createBookElements() {
        books.forEach((book) => book.element = createBookElement(book));
    }

    function removeBookElements() {
        books.forEach((book) => book.element = null);
    }

    function displayBookElements() {
        if (shouldDisplayNoBooksMsg()) {
            displayNoBooksMsg();
            return;
        }
        hideNoBooksMsg();

        for (let i = books.length - 1; i >= 0; --i) {
            const bookElement = books[i].element;
            if (shouldBeFiltered(books[i].isRead)) {
                bookElement.classList.add('hide');
            }
            booksContainer.appendChild(bookElement);
        }
        updateBookCount();
    }

    function shouldDisplayNoBooksMsg() {
        if (books.length === 0) {
            return true;
        }

        if (activeFilter === 'all') {
            return false;
        }

        return books.filter(({ element }) => !element.classList.contains('hide')).length === 0;
    }

    function displayNoBooksMsg() {
        const msg = books.length === 0 ? NO_BOOKS_MSGS.all : NO_BOOKS_MSGS[activeFilter];
        noBooks.textContent = msg;
        noBooks.classList.remove('hide');
    }

    function hideNoBooksMsg() {
        noBooks.textContent = '';
        noBooks.classList.add('hide');
    }

    function createElement(tag, className = null, text = null) {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }

        if (text) {
            element.textContent = text;
        }

        return element;
    }

    function createBookElement(book) {
        const bookContainer = createElement('div', 'book');

        const bookInfo = createElement('div', 'book-info');
        const bookTitle = createElement('p', 'book-title', book.title);
        const bookAuthor = createElement('p', 'book-author', book.author);
        const bookNumPages = createElement('p', 'book-num-pages', book.numPages);
        bookInfo.append(bookTitle, bookAuthor, bookNumPages);
        bookContainer.appendChild(bookInfo);

        const bookActions = createBookElementActions(book);
        bookContainer.appendChild(bookActions);

        return bookContainer;
    }

    function createBookElementActions(book) {
        const bookActions = createElement('div', 'book-actions', null);
        bookActions.dataset.id = book.id;

        const bookReadButton = createBookElementActionButton(
            'read-button',
            ...getBookElementActionReadButtonContent(book.isRead)
        );
        bookReadButton.addEventListener('click', handleReadButton);
        bookActions.appendChild(bookReadButton);

        const bookDeleteButton = createBookElementActionButton(
            'delete-button',
            'fas fa-trash-alt',
            'DELETE BOOK'
        );
        bookDeleteButton.addEventListener('click', handleDeleteButton);
        bookActions.appendChild(bookDeleteButton);

        return bookActions;
    }

    function getBookElementActionReadButtonContent(isRead) {
        return [
            `fas fa-${isRead ? 'check' : 'bullseye'}`,
            isRead ? 'BOOK READ' : 'MARK READ'
        ];
    }

    function createBookElementActionButton(buttonClassName, iconClassName, text) {
        const button = createElement('button');
        button.className = buttonClassName;

        const buttonIconContainer = createElement('span');
        const buttonIcon = createElement('i', iconClassName);
        buttonIconContainer.appendChild(buttonIcon);
        button.appendChild(buttonIconContainer);

        const buttonTextContainer = createElement('span', null, text);
        button.appendChild(buttonTextContainer);

        return button;
    }

    function shouldBeFiltered(isRead) {
        return activeFilter !== 'all' && (
            (activeFilter === 'read' && !isRead) || (activeFilter === 'not-read' && isRead)
        );
    }

    function updateBookCount() {
        bookCount.innerHTML = `<strong>${books.length}</strong> book${books.length !== 1 ? 's' : ''}`;
    }

    function updateBookStorage() {
        localStorage.setItem('books', JSON.stringify(books));
    }

    function handleReadButton(event) {
        const targetId = +event.currentTarget.parentNode.dataset.id;
        const match = findBook(targetId);
        if (!match) {
            return;
        }
        match.book.toggleIsRead();
        if (shouldBeFiltered(match.book.isRead)) {
            match.book.element.classList.add('hide');
            if (shouldDisplayNoBooksMsg()) {
                displayNoBooksMsg();
            } else {
                hideNoBooksMsg();
            }
        }
        updateBookStorage();
    }

    function handleDeleteButton(event) {
        const targetId = +event.currentTarget.parentNode.dataset.id;
        const match = findBook(targetId);
        if (!match) {
            return;
        }
        match.book.element.remove();
        books.splice(match.index, 1);
        if (shouldDisplayNoBooksMsg()) {
            displayNoBooksMsg();
        } else {
            hideNoBooksMsg();
        }
        updateBookCount();
        updateBookStorage();
    }

    function findBook(targetId) {
        if (!Number.isFinite(targetId)) {
            return null;
        }
        const bookIndex = books.findIndex(({ id }) => targetId === id);
        if (bookIndex === -1) {
            return null;
        }
        return {
            index: bookIndex,
            book: books[bookIndex]
        };
    }

    function toggleColorMode() {
        let colorMode = null;
        if (!root.dataset.colorMode || root.dataset.colorMode === 'light') {
            colorMode = 'dark';
        } else {
            colorMode = 'light';
        }
        root.dataset.colorMode = colorMode;
        localStorage.setItem('color-mode', colorMode);
    }

    function filterBooks(event) {
        const button = event.currentTarget;
        if (button.classList.contains('active') || !button.dataset.filter) {
            return;
        }

        const filter = button.dataset.filter.toLowerCase();
        if (!VALID_FILTERS.includes(filter)) {
            return;
        }

        activeFilter = filter;
        const activeButton = document.querySelector('.right-actions .filter.active');
        if (activeButton) {
            activeButton.classList.remove('active');
        }
        button.classList.add('active');
        localStorage.setItem('filter', activeFilter);

        if (books.length === 0) {
            return;
        }

        books.forEach((book) => {
            if (shouldBeFiltered(book.isRead)) {
                book.element.classList.add('hide');
            } else {
                book.element.classList.remove('hide');
            }
        });

        if (shouldDisplayNoBooksMsg()) {
            displayNoBooksMsg();
        } else {
            hideNoBooksMsg();
        }
    }

    function loadBooksFromLocalStorage() {
        const storedBooks = JSON.parse(localStorage.getItem('books'));
        books = storedBooks.map(({ title, author, numPages, isRead, id }) => {
            return new Book(title, author, numPages, isRead, id);
        });
    }

    function loadDemoBooks() {
        removeBookElements();
        books = [...BOOKS_DEMO];
        createBookElements();
        displayBookElements();
        updateBookStorage();
    }

    function openAddBookModal() {
        root.classList.add('clipped');
        addBookModal.classList.add('active');
        addBookForm.elements[0].focus();
    }

    function closeAddBookModal() {
        root.classList.remove('clipped');
        addBookModal.classList.remove('active');
        addBookForm.reset();
        Array.from(addBookForm.elements).forEach(hideInputError);
    }

    function handleAddBookFormSubmission(event) {
        event.preventDefault();

        if (!isFormValid()) {
            return;
        }

        const newBook = new Book(
            addBookForm.elements['book-title'].value,
            addBookForm.elements['book-author'].value,
            addBookForm.elements['book-num-pages'].value,
            addBookForm.elements['book-is-read'].checked
        );
        newBook.element = createBookElement(newBook);
        books.push(newBook);

        if (shouldBeFiltered(newBook.isRead)) {
            newBook.element.classList.add('hide');
        }
        booksContainer.prepend(newBook.element);

        if (shouldDisplayNoBooksMsg()) {
            displayNoBooksMsg();
        } else {
            hideNoBooksMsg();
        }

        closeAddBookModal();
        updateBookStorage();
        updateBookCount();
    }

    function isFormValid() {
        let formValid = true;
        // eslint-disable-next-line no-restricted-syntax
        for (const input of addBookForm.elements) {
            if (input.type !== 'text' && input.type !== 'number') {
                continue;
            }

            if (!input.validity.valid) {
                showInputError(input);
                formValid = false;
            } else {
                hideInputError(input);
            }
        }
        return formValid;
    }

    function showInputError(input) {
        const inputLabelText = input.previousElementSibling.textContent;
        const inputError = input.nextElementSibling;
        let msg = null;
        if (input.validity.valueMissing) {
            msg = 'is required';
        } else if (input.validity.tooLong) {
            msg = `should have maximum ${input.maxLength} characters; you entered ${input.value.length}`;
        } else if (input.validity.rangeOverflow) {
            msg = `should be less than or equal to ${input.max}; you entered ${input.value}`;
        } else if (input.validity.rangeUnderflow) {
            msg = `should be greater than or equal to ${input.min}; you entered ${input.value}`;
        } else {
            msg = 'is invalid';
        }
        inputError.textContent = `${inputLabelText} ${msg}!`;
    }

    function hideInputError(input) {
        if (input.type !== 'submit' && input.nextElementSibling) {
            input.nextElementSibling.textContent = '';
        }
    }
}());
