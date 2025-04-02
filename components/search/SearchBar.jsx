"use client"

const SearchBar = () => {
    return (
        <div className="w-full max-w-md mb-8 mx-auto">
            <input
                type="text"
                placeholder="Search..."
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-black"
            />
        </div>
    );
};

export default SearchBar;