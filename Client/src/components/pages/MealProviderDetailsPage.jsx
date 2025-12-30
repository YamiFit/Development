import { useParams } from "react-router-dom";
import Layout from "../layout/Layout";
import MealProviderDetails from "../Meals/MealProviderDetails";

const MealProviderDetailsPage = () => {
  const { providerId } = useParams();

  return (
    <Layout>
      <MealProviderDetails providerId={providerId} />
    </Layout>
  );
};

export default MealProviderDetailsPage;
