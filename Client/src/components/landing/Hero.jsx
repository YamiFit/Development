import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { heroTranslations } from "@/data/translations";

const Hero = () => {
  const { language } = useLanguage();
  const t = heroTranslations[language];
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-background">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 start-10 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div
          className="absolute bottom-1/4 end-10 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 animate-fade-in-left">
            <div className="inline-flex items-center bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-medium text-primary me-2">
                {t.badge}
              </span>
              <span className="text-xs text-foreground">
                {t.badgeFeature}
              </span>
              <ChevronRight className="h-4 w-4 text-secondary ms-1" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-foreground">
              {t.mainHeading}{" "}
              <span className="text-gradient">{t.highlight}</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              {t.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-2xl"
                >
                  {t.startJourney}
                  <ArrowRight className="ms-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#pricing" className="inline-flex">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-secondary text-secondary hover:bg-secondary/10 py-6 rounded-2xl"
                >
                  {t.explorePlans}
                  <ArrowUpRight className="ms-2 h-5 w-5" />
                </Button>
              </a>
            </div>
            <div
              className={`mt-8 flex items-center ${
                language === "ar" ? "flex-row-reverse" : ""
              } gap-6`}
            >
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {t.activeUsers}
                </p>
                <p className="text-sm text-muted-foreground">{t.activeUsersLabel}</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {t.mealsTacked}
                </p>
                <p className="text-sm text-muted-foreground">{t.mealsTrackedLabel}</p>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {t.TrustedbyFitnessEnthusiastsWorldwide}
                </p>
                <p className="text-sm text-muted-foreground">{t.trustedBy}</p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 mt-12 lg:mt-0 animate-fade-in-right">
            <div className="relative max-w-md mx-auto animate-float">
              <img
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&h=800"
                alt="Healthy food and nutrition tracking"
                className="rounded-3xl shadow-2xl border border-primary/20"
              />
              <div className="absolute -end-6 -bottom-6 bg-card backdrop-blur-md rounded-2xl p-4 border border-primary/30 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.caloriesSaved}</p>
                    <p className="text-lg font-bold text-primary">
                      {t.caloriesValue}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -start-6 -top-6 bg-card backdrop-blur-md rounded-2xl p-4 border border-secondary/30 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-secondary/20 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.todayGoal}</p>
                    <p className="text-lg font-bold text-foreground">
                      {t.completed}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
