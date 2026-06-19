import EducationalSummaryCard from "./EducationalSummaryCard";
import { StudentInsight } from "./buildStudentInsight";

export default function StudentInsightCard({
  insight
}: {
  insight: StudentInsight
}) {

  return (
    <EducationalSummaryCard
      items={[
        {
          title: "ماذا تعني نتيجة الطالب؟",
          text: insight.meaning
        },
        {
          title: "أهميتها تربوياً",
          text: insight.importance
        },
        {
          title: "الإجراء المقترح",
          text: insight.action
        }
      ]}
    />
  );
}