<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <h1>Track Your Fitness Journey</h1>
        <p>
          WorkoutTracker helps you track your workouts, monitor progress, and achieve your fitness goals.
        </p>
        <div class="hero-buttons">
          <router-link to="/login" class="btn btn-primary btn-lg">Get Started</router-link>
          <a href="#features" class="btn btn-outline btn-lg">Learn More</a>
        </div>
      </div>
      <div class="hero-image">
        <img src="https://images.unsplash.com/photo-1579126038374-6064e9370f0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" alt="Workout">
      </div>
    </section>

    <section id="features" class="features">
      <h2 class="section-title">Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <h3>Workout Plans</h3>
          <p>Create and customize workout plans to fit your fitness goals and schedule.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <h3>Progress Tracking</h3>
          <p>Track your progress with visual charts and detailed statistics.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-bullseye"></i>
          </div>
          <h3>Goal Setting</h3>
          <p>Set personal fitness goals and track your journey to achieving them.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-history"></i>
          </div>
          <h3>Workout History</h3>
          <p>Keep a detailed log of your workout history to analyze your performance over time.</p>
        </div>
      </div>
    </section>

    <section class="how-it-works">
      <h2 class="section-title">How It Works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>Create an Account</h3>
          <p>Sign up with Auth0 secure authentication to get started.</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>Create Workout Plans</h3>
          <p>Design custom workout plans with exercises tailored to your needs.</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>Log Your Workouts</h3>
          <p>Record your completed workouts and track your progress.</p>
        </div>
        <div class="step">
          <div class="step-number">4</div>
          <h3>Achieve Your Goals</h3>
          <p>Set goals, monitor your progress, and celebrate your achievements.</p>
        </div>
      </div>
    </section>

    <section class="cta">
      <h2>Ready to Start Your Fitness Journey?</h2>
      <p>Join WorkoutTracker today and take control of your fitness goals.</p>
      <router-link to="/login" class="btn btn-primary btn-lg">Get Started Now</router-link>
    </section>
  </div>
</template>

<script>
export default {
  name: 'Home'
};
</script>

<style scoped>
.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding: 2rem 0;
  margin-bottom: 3rem;
}

.hero-content {
  flex: 1;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  color: var(--dark-color);
}

.hero-content p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  color: #555;
  line-height: 1.6;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
}

.btn-lg {
  padding: 0.9rem 2rem;
  font-size: 1.1rem;
}

.btn-outline {
  color: var(--primary-color);
  background-color: transparent;
  border: 2px solid var(--primary-color);
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: white;
}

.hero-image {
  flex: 1;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.hero-image img {
  width: 100%;
  height: auto;
  display: block;
}

.section-title {
  text-align: center;
  font-size: 2.2rem;
  margin-bottom: 3rem;
  color: var(--dark-color);
}

.features {
  padding: 4rem 0;
  background-color: #f9f9f9;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.feature-card {
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
}

.feature-card h3 {
  font-size: 1.4rem;
  margin-bottom: 1rem;
  color: var(--dark-color);
}

.how-it-works {
  padding: 4rem 0;
}

.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.step {
  text-align: center;
  padding: 1.5rem;
}

.step-number {
  width: 60px;
  height: 60px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 auto 1.5rem;
}

.step h3 {
  font-size: 1.4rem;
  margin-bottom: 1rem;
  color: var(--dark-color);
}

.cta {
  background-color: var(--primary-color);
  color: white;
  padding: 4rem 0;
  text-align: center;
  border-radius: 10px;
  margin-bottom: 2rem;
}

.cta h2 {
  font-size: 2.2rem;
  margin-bottom: 1rem;
}

.cta p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta .btn {
  background-color: white;
  color: var(--primary-color);
  border: none;
}

.cta .btn:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column-reverse;
  }
  
  .hero-content h1 {
    font-size: 2.2rem;
  }
  
  .hero-buttons {
    flex-direction: column;
  }
  
  .cta h2 {
    font-size: 1.8rem;
  }
}
</style> 