import { Card, CardHeader, CardBody, Image } from "@heroui/react";

interface CardAaaProps {
    branch: string;
    position: string;
    name: string;
    imageUrl: string;
    imageAlt?: string;
}

export default function CardProfile({
                                    branch,
                                    position,
                                    name,
                                    imageUrl,
                                    imageAlt = "Card background",
                                }: CardAaaProps) {
    return (
        <Card className="py-3">
            <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <Image
                    alt={imageAlt}
                    className="object-cover rounded-xl object-top"
                    src={imageUrl}
                    width={180}
                    height={210}
                />
            </CardHeader>
            <CardBody className="overflow-visible py-2 ms-1">
                <h4 className="font-bold text-large">{name}</h4>
                <small className="text-default-500 ms-1">{position}</small>
                <p className="text-tiny uppercase font-bold ms-1">{branch}</p>
            </CardBody>
        </Card>
    );
}
