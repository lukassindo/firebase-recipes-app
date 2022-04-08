import "./App.css";
import { useEffect, useState } from "react";
import FirebaseAuthService from "./FirebasAuthService";
import LoginForm from "./components/LoginForm";
import AddEditRecipeForm from "./components/AddEditRecipeForm";
import FirebaseFirestoreService from "./FirebaseFirestoreService";

function App() {
  const [user, setUser] = useState(null);
  const [currentRecipe, setCurrentRecipe] = useState({});
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetchRecipes()
      .then((fetchedRecipes) => {
        setRecipes(fetchedRecipes);
      })
      .catch((error) => {
        console.error(error.message);
        throw error;
      });
  }, [user]);

  FirebaseAuthService.subscribeToAuthChanges(setUser);

  const fetchRecipes = async () => {
    const queries = [];

    if (!user) {
      queries.push({
        field: "isPublished",
        condition: "==",
        value: true,
      });
    }
    let fetchedRecipes = [];
    try {
      const response = await FirebaseFirestoreService.readDocuments({
        collection: "recipes",
        queries: queries,
      });
      const newRecipes = response.docs.map((recipeDoc) => {
        const id = recipeDoc.id;
        const data = recipeDoc.data();
        data.publishDate = new Date(data.publishDate.seconds * 1000);
        return { ...data, id };
      });

      fetchedRecipes = [...newRecipes];
    } catch (error) {
      console.error(error.message);
      throw error;
    }
    return fetchedRecipes;
  };

  const handleFetchRecipes = async () => {
    try {
      const fetchedRecipes = await fetchRecipes();
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  };

  const handleAddRecipe = async (newRecipe) => {
    try {
      const response = await FirebaseFirestoreService.createDocument(
        "recipes",
        newRecipe
      );

      handleFetchRecipes();

      alert(`succesfully created a recipe with ID = ${response.id}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateRecipe = async (newRecipe, recipeId) => {
    try {
      await FirebaseFirestoreService.updateDocument(
        "recipes",
        recipeId,
        newRecipe
      );
      handleFetchRecipes();
      alert(`successfully updated recipe with ID = ${recipeId}`);
      setCurrentRecipe(null);
    } catch (error) {
      alert(error.message);
      throw error;
    }
  };

  const handleEditRecipeClick = (recipeId) => {
    console.log(recipeId);
    console.log(recipes);
    const selectedRecipe = recipes.find((recipe) => {
      return recipe.id === recipeId;
    });
    console.log(selectedRecipe);
    if (selectedRecipe) {
      setCurrentRecipe({});
      // window.scrollTo(0, document.body.scrollHeight);
    }
  };

  const handleEditRecipeCancel = () => {
    setCurrentRecipe(null);
  };

  const lookupCategoryLabel = (categoryKey) => {
    const categories = {
      breadsSandwichesAndPizza: "Breads, Sandwiches and Pizza",
      eggsAndBreakfast: "Eggs & Breakfast",
      soups: "Soups",
      fishAndSeafood: "Fish & Seafood",
      vegetables: "Vegetables",
    };

    const label = categories[categoryKey];
    return label;
  };

  const formatDate = (date) => {
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getFullYear();
    const dateString = `${day}-${month}-${year}`;
    return dateString;
  };

  return (
    <div className="App">
      <div className="title-row">
        <h1 className="title">Firebase Recipes</h1>
        <LoginForm existingUser={user}></LoginForm>
      </div>
      <div className="main">
        <div className="center">
          <div className="recipe-list-box">
            {recipes && recipes.length > 0 ? (
              <div className="recipe-list">
                {recipes.map((recipe) => {
                  return (
                    <div className="recipe-card" key={recipe.id}>
                      {recipe.isPublished === false ? (
                        <div className="unpublished">Unpublished</div>
                      ) : null}
                      <div className="recipe-name">{recipe.name}</div>
                      <div className="recipe-field">
                        Category: {lookupCategoryLabel(recipe.category)}
                      </div>
                      <div className="recipe-field">
                        Publish Date: {formatDate(recipe.publishDate)}
                      </div>
                      {user ? (
                        <button
                          className="primary-button edit-button"
                          type="button"
                          onClick={() => handleEditRecipeClick(recipe.id)}
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
        {user ? (
          <AddEditRecipeForm
            // existingRecipe={currentRecipe}
            // handleUpdateRecipe={handleUpdateRecipe}
            handleAddRecipe={handleAddRecipe}
            // handleEditRecipeCancel={handleEditRecipeCancel}
          ></AddEditRecipeForm>
        ) : null}
      </div>
    </div>
  );
}

export default App;
