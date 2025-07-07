"use client";

import React from "react";
import CardAaa from "@/components/card/card-aaa";

export default function ProgramPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">AAA Classes</h1>
            <div className={"container mx-auto flex flex-wrap justify-start gap-6"}>
                <CardAaa
                    department="Branch Funmall"
                    ageRange="Main: Tan Bunchhay"
                    title="Robotics for Kids"
                    imageUrl="https://aaaschoolkh.com/asset/img/coding-kid.png"
                />
                <CardAaa
                    department="Branch Peng Hout"
                    ageRange="Main: Teing Kimlang"
                    title="Robotics for Kids"
                    imageUrl="https://aaaschoolkh.com/asset/img/coding-kid.png"
                />
                <CardAaa
                    department="Branch OCIC"
                    ageRange="Main: Phonn Sovanlyseth"
                    title="Robotics for Kids"
                    imageUrl="https://aaaschoolkh.com/asset/img/coding-kid.png"
                />
            </div>
        </div>
    );
}
