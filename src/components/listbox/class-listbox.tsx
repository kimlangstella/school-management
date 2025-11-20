"use client";

import React, {useState, useMemo} from "react";
import {
    Listbox,
    ListboxItem,
    Chip,
    ScrollShadow,
} from "@heroui/react";

type ClassObject = {
    id: number;
    name: string;
    program_id: number;
    program_names: string;
    branch_id: number;
    branch_name: string;
};

const ClassListbox: React.FC = () => {
    const [classes, ] = useState<ClassObject[]>([]);
    // Store selected classroom IDs as numbers
    const [selected, setSelected] = useState<number[]>([]);

    // useEffect(() => {
    //     // Grab token from cookie.
    //     const cookieToken = document.cookie
    //         .split("; ")
    //         .find((row) => row.startsWith("token="))
    //         ?.split("=")[1];
    //     async function fetchClasses() {
    //         try {
    //             const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/academics/classroom/`, {
    //                 headers: {
    //                     Authorization: `Bearer ${cookieToken ?? ""}`,
    //                 },
    //             });
    //             const json = await response.json();
    //             setClasses(json.results);
    //         } catch (error) {
    //             console.error("Error fetching classes:", error);
    //         }
    //     }

    //     fetchClasses().then(r => r);
    // }, []);

    const arraySelected = Array.from(selected);

    const topContent = useMemo(() => {
        if (arraySelected.length === 0) return null;

        return (
            <div className="w-full max-w-[260px] overflow-x-auto">
                <ScrollShadow
                    hideScrollBar
                    className="flex flex-nowrap gap-1 py-0.5 px-2"
                    orientation="horizontal"
                >
                    {selected.map((id) => {
                        const item = classes.find((cls) => cls.id === id);
                        return item ? <Chip key={id} size="sm">{item.name}</Chip> : null;
                    })}
                </ScrollShadow>
            </div>
        );
    }, [arraySelected.length, selected, classes]);

    return (
        <div>
            {/* Title with red asterisk */}
            <label className="block mb-1 text-sm">
                Programs<span className="text-red-500">*</span>
            </label>
            <div
                className="w-full max-w-[300px] border-3 px-1 py-2 rounded-xl border-default-200 dark:border-default-100">

                <Listbox
                    classNames={{
                        base: "max-w-xs",
                        // Set the list's max height to 180px and enable vertical scrolling when needed.
                        list: "max-h-[100px] overflow-y-auto",
                    }}
                    defaultSelectedKeys={[]}
                    items={classes}
                    label="Select Classes"
                    selectionMode="multiple"
                    topContent={topContent}
                    variant="flat"
                    onSelectionChange={(keys) => {
                        if (keys instanceof Set) {
                            // Convert each key to a number.
                            const numKeys = [...keys].map((key) => Number(key));
                            setSelected(numKeys);
                        } else if (keys === "all") {
                            setSelected(classes.map((cls) => cls.id));
                        } else {
                            console.warn("Expected a Set, got:", keys);
                        }
                    }}
                >
                    {(item: ClassObject) => (
                        <ListboxItem key={item.id} textValue={item.name}>
                            <div className="flex flex-col">
                                <span className="text-small font-medium">{item.name}</span>
                                <span className="text-tiny text-default-400">{item.branch_name}</span>
                            </div>
                        </ListboxItem>
                    )}
                </Listbox>
            </div>
        </div>
    );
};

export default ClassListbox;
