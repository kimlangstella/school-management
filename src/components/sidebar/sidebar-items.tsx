import {Chip} from "@heroui/react";
import {Icon} from "@iconify/react";

import {type SidebarItem, SidebarItemType} from "./sidebar";
import TeamAvatar from "../icon/team-avatar";

/**
 * Please check the https://heroui.com/docs/guide/routing to have a seamless router integration
 */

export const items: SidebarItem[] = [
    {
        key: "overview",
        href: "#",
        icon: "solar:home-2-linear",
        title: "Overview",
    },
    {
        key: "branch",
        href: "#",
        icon: "solar:widget-2-outline",
        title: "Branch",
        endContent: (
            <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
        ),
    },
    {
        key: "program",
        href: "#",
        icon: "solar:checklist-minimalistic-outline",
        title: "Program",
        endContent: (
            <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
        ),
    },
    {
        key: "class",
        href: "#",
        icon: "solar:users-group-two-rounded-outline",
        title: "Class",
    },
    {
        key: "student",
        href: "#",
        icon: "solar:sort-by-time-linear",
        title: "Student",
        endContent: (
            <Chip size="sm" variant="flat">
                New
            </Chip>
        ),
    },
    {
        key: "analytics",
        href: "#",
        icon: "solar:chart-outline",
        title: "Analytics",
    },
    {
        key: "perks",
        href: "#",
        icon: "solar:gift-linear",
        title: "Perks",
        endContent: (
            <Chip size="sm" variant="flat">
                3
            </Chip>
        ),
    },
    {
        key: "expenses",
        href: "#",
        icon: "solar:bill-list-outline",
        title: "Expenses",
    },
    {
        key: "settings",
        href: "#",
        icon: "solar:settings-outline",
        title: "Settings",
    },
];

export const sectionItems: SidebarItem[] = [
    {
        key: "overview",
        title: "Overview",
        items: [
            {
                key: "overview",
                href: "/",
                icon: "solar:home-2-linear",
                title: "Overview",
            },
            {
                key: "student",
                href: "/student",
                icon: "solar:users-group-two-rounded-outline",
                title: "Student",
            },
            {
                key: "trial",
                href: "/trial",
                icon: "mdi:account-question",
                title: "Trial",
            },
            // {
            //     key: "Payment",
            //     href: "/payment",
            //     icon: "mdi:cash",
            //     title: "Payment",
            // },
            {
                key: "Attendance",
                href: "/attendance",
                icon: "mdi:clipboard-check-outline",
                title: "Attendance",
            },
            {
                key: "Exam",
                href: "/exam",
                icon: "mdi:file-document-edit-outline",
                title: "Exam",
            },
        ],
    },
    // {
    //     key: "organization",
    //     title: "Organization",
    //     items: [
    //         {
    //             key: "branch",
    //             href: "/branch",
    //             icon: "icon-park-twotone:branch-one",
    //             title: "Branch",
    //         },
    //         {
    //             key: "program",
    //             href: "/program",
    //             icon: "nrk:media-programguide",
    //             title: "Program",
    //         },
    //         {
    //             key: "course",
    //             href: "/course",
    //             icon: "hugeicons:course",
    //             title: "Course",
    //         },
    //         {
    //             key: "class",
    //             href: "/class",
    //             icon: "mingcute:classify-2-line",
    //             title: "Class",
    //         },
    //         {
    //             key: "teacher",
    //             href: "/teacher",
    //             icon: "hugeicons:teacher",
    //             title: "Teacher",
    //         },
    //         {
    //             key: "settings",
    //             href: "/settings",
    //             icon: "solar:settings-outline",
    //             title: "Settings",
    //         },
    //     ],
    // },
];

export const sectionItemsWithTeams: SidebarItem[] = [
    ...sectionItems,
    {
        key: "Academy",
        title: "Academy",
        items: [
           {
        key: "school",
        href: "/school",
        icon: "fa6-solid:school",
        title: "School",
      },
      {
        key: "branch",
        href: "/branch",
        icon: "mdi:map-marker-radius",
        title: "Branch",
      },
      {
        key: "program",
        href: "/program",
        icon: "mdi:file-document-box-outline",
        title: "Program",
      },
      {
        key: "course",
        href: "/course",
        icon: "mdi:notebook-outline",
        title: "Course",
      },
        {
        key: "staff",
        href: "/staff",
        icon: "fa-users",
        title: "Staff",
      },
        ],
    },
];

export const brandItems: SidebarItem[] = [
    {
        key: "overview",
        title: "Overview",
        items: [
            {
                key: "home",
                href: "#",
                icon: "solar:home-2-linear",
                title: "Home",
            },
            {
                key: "projects",
                href: "#",
                icon: "solar:widget-2-outline",
                title: "Projects",
                endContent: (
                    <Icon
                        className="text-primary-foreground/60"
                        icon="solar:add-circle-line-duotone"
                        width={24}
                    />
                ),
            },
            {
                key: "tasks",
                href: "#",
                icon: "solar:checklist-minimalistic-outline",
                title: "Tasks",
                endContent: (
                    <Icon
                        className="text-primary-foreground/60"
                        icon="solar:add-circle-line-duotone"
                        width={24}
                    />
                ),
            },
            {
                key: "team",
                href: "#",
                icon: "solar:users-group-two-rounded-outline",
                title: "Team",
            },
            {
                key: "tracker",
                href: "#",
                icon: "solar:sort-by-time-linear",
                title: "Tracker",
                endContent: (
                    <Chip className="bg-primary-foreground font-medium text-primary" size="sm" variant="flat">
                        New
                    </Chip>
                ),
            },
        ],
    },
    {
        key: "your-teams",
        title: "Your Teams",
        items: [
            {
                key: "heroui",
                href: "#",
                title: "HeroUI",
                startContent: (
                    <TeamAvatar
                        classNames={{
                            base: "border-1 border-primary-foreground/20",
                            name: "text-primary-foreground/80",
                        }}
                        name="Hero UI"
                    />
                ),
            },
            {
                key: "tailwind-variants",
                href: "#",
                title: "Tailwind Variants",
                startContent: (
                    <TeamAvatar
                        classNames={{
                            base: "border-1 border-primary-foreground/20",
                            name: "text-primary-foreground/80",
                        }}
                        name="Tailwind Variants"
                    />
                ),
            },
            {
                key: "heroui-pro",
                href: "#",
                title: "HeroUI Pro",
                startContent: (
                    <TeamAvatar
                        classNames={{
                            base: "border-1 border-primary-foreground/20",
                            name: "text-primary-foreground/80",
                        }}
                        name="HeroUI Pro"
                    />
                ),
            },
        ],
    },
];

export const sectionLongList: SidebarItem[] = [
    ...sectionItems,
    {
        key: "payments",
        title: "Payments",
        items: [
            {
                key: "payroll",
                href: "#",
                title: "Payroll",
                icon: "solar:dollar-minimalistic-linear",
            },
            {
                key: "invoices",
                href: "#",
                title: "Invoices",
                icon: "solar:file-text-linear",
            },
            {
                key: "billing",
                href: "#",
                title: "Billing",
                icon: "solar:card-outline",
            },
            {
                key: "payment-methods",
                href: "#",
                title: "Payment Methods",
                icon: "solar:wallet-money-outline",
            },
            {
                key: "payouts",
                href: "#",
                title: "Payouts",
                icon: "solar:card-transfer-outline",
            },
        ],
    },
    {
        key: "your-teams",
        title: "Your Teams",
        items: [
            {
                key: "heroui",
                href: "#",
                title: "HeroUI",
                startContent: <TeamAvatar name="Hero UI" />,
            },
            {
                key: "tailwind-variants",
                href: "#",
                title: "Tailwind Variants",
                startContent: <TeamAvatar name="Tailwind Variants" />,
            },
            {
                key: "heroui-pro",
                href: "#",
                title: "HeroUI Pro",
                startContent: <TeamAvatar name="HeroUI Pro" />,
            },
        ],
    },
];

export const sectionNestedItems: SidebarItem[] = [
    {
        key: "home",
        href: "#",
        icon: "solar:home-2-linear",
        title: "Home",
    },
    {
        key: "projects",
        href: "#",
        icon: "solar:widget-2-outline",
        title: "Projects",
        endContent: (
            <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
        ),
    },
    {
        key: "tasks",
        href: "#",
        icon: "solar:checklist-minimalistic-outline",
        title: "Tasks",
        endContent: (
            <Icon className="text-default-400" icon="solar:add-circle-line-duotone" width={24} />
        ),
    },
    {
        key: "team",
        href: "#",
        icon: "solar:users-group-two-rounded-outline",
        title: "Team",
    },
    {
        key: "tracker",
        href: "#",
        icon: "solar:sort-by-time-linear",
        title: "Tracker",
        endContent: (
            <Chip size="sm" variant="flat">
                New
            </Chip>
        ),
    },
    {
        key: "analytics",
        href: "#",
        icon: "solar:chart-outline",
        title: "Analytics",
    },
    {
        key: "perks",
        href: "#",
        icon: "solar:gift-linear",
        title: "Perks",
        endContent: (
            <Chip size="sm" variant="flat">
                3
            </Chip>
        ),
    },
    {
        key: "cap_table",
        title: "Cap Table",
        icon: "solar:pie-chart-2-outline",
        type: SidebarItemType.Nest,
        items: [
            {
                key: "shareholders",
                icon: "solar:users-group-rounded-linear",
                href: "#",
                title: "Shareholders",
            },
            {
                key: "note_holders",
                icon: "solar:notes-outline",
                href: "#",
                title: "Note Holders",
            },
            {
                key: "transactions_log",
                icon: "solar:clipboard-list-linear",
                href: "#",
                title: "Transactions Log",
            },
        ],
    },
    {
        key: "expenses",
        href: "#",
        icon: "solar:bill-list-outline",
        title: "Expenses",
    },
];
