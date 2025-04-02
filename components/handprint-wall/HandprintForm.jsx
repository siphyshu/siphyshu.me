import React, { useState } from "react";

const HandprintForm = ({ position, onSubmit, onCancel, availableColors, tempHandprint }) => {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [selectedColor, setSelectedColor] = useState(tempHandprint.color);

  const handleSubmit = (e) => {
    e.preventDefault();
    let formattedLink = link;
    if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
      formattedLink = `https://${link}`;
    }

    onSubmit({
      name: name || "Anonymous",
      link: formattedLink || null,
      color: selectedColor,
    });
  };

  return (
    <div
      className="absolute bg-white border border-black shadow-md"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%)",
      }}
    >
      <form onSubmit={handleSubmit} className="p-4">
        <input
          type="text"
          placeholder="Name / Alias"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full mb-2 px-2 py-1 border border-black"
        />
        <input
          type="text"
          placeholder="Link (Optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="block w-full mb-2 px-2 py-1 border border-black"
        />
        <div className="flex justify-between items-center mb-2">
          <div className="flex justify-between w-full">
            {Object.entries(availableColors).map(([key, value]) => (
              <div
                key={key}
                className={`w-6 h-6 cursor-pointer ${
                  selectedColor === key ? "ring-2 ring-black" : ""
                }`}
                style={{ backgroundColor: value }}
                onClick={() => setSelectedColor(key)}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 hover:bg-gray-800"
          >
            Imprint!
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-black px-4 py-2 hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default HandprintForm;