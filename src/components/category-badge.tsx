import { useAppSelector } from "@/redux/hooks";
import { Badge } from "./ui/badge";
import { cn, stringToColor } from "@/lib/utils";

const CategoryBadge = ({ categoryId }: { categoryId?: string }) => {
  const { mappedCategoriesById } = useAppSelector((state) => state.categories);
  const category = mappedCategoriesById[categoryId || ""];
  if (!category) return null;
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", `text-[${stringToColor(category.name)}]`)}
    >
      {category.name}
    </Badge>
  );
};

export default CategoryBadge;
