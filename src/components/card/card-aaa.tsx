"use client";

import {
  Card,
  CardHeader,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface CardAaaProps {
  name: string;
  description: string;
  age: string;
  program?: string;
  branch?: string;
  totalMarks?: number;
  examType?: string;
  examDate?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function CardAaa({
  name,
  description,
  age,
  program,
  branch,
  totalMarks,
  examType,
  examDate,
  onEdit,
  onDelete,
}: CardAaaProps) {
  return (
    <Card className="relative py-4 overflow-visible">
      <div className="absolute top-2 right-2">
        <Dropdown
          classNames={{ content: "z-50 min-w-[120px]" }}
          placement="bottom-end"
        >
          <DropdownTrigger>
            <Button isIconOnly size="sm" variant="light" radius="full" >
              <span>
                <Icon icon="solar:menu-dots-bold" width={16} height={16} />
              </span>
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            classNames={{
              base: "dark text-foreground bg-background max-h-[300px] overflow-y-auto",
            }}
          >
            <DropdownItem 
              key="edit" 
              onClick={onEdit}
              classNames={{
                base: "text-foreground data-[hover=true]:bg-default-100",
              }}
            >
              Edit
            </DropdownItem>
            <DropdownItem
              key="delete"
              onClick={onDelete}
              className="text-danger"
              classNames={{
                base: "text-danger data-[hover=true]:bg-danger-50",
              }}
            >
              Delete
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start space-y-1">
        <p className="text-tiny uppercase font-bold">{name}</p>
        <small className="text-default-500">{description}</small>
        <small className="text-default-500">{age}</small>

        {program && (
          <small className="text-default-500">📘 Program: {program}</small>
        )}
        {branch && (
          <small className="text-default-500">🏢 Branch: {branch}</small>
        )}
        {typeof totalMarks === "number" && (
          <small className="text-default-500">📊 Marks: {totalMarks}</small>
        )}
        {examType && (
          <small className="text-default-500">🧪 Type: {examType}</small>
        )}
        {examDate && (
          <small className="text-default-500">📅 Date: {examDate}</small>
        )}
      </CardHeader>
    </Card>
  );
}
