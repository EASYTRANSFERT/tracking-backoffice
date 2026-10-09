<template>

  <main class="grid min-h-screen w-full grid-cols-1 md:grid-cols-2">

    <section class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12 md:min-h-0">
          <img
                src="@/assets/background.svg"
                alt="Background"
                class="absolute inset-0 w-full h-full object-cover"
              />
      <div class="relative z-10 w-full max-w-md rounded-lg  bg-transparent px-8 py-10 shadow-xl opacity-90 backdrop-blur-md sm:px-12">
        <div class="mb-8 text-center">
            <h1 class="text-neutral-500 text-4xl font-bold tracking-tight">Login</h1>
        </div>
            <img src="@/assets/kaybiclogo.png" alt="logo" class=" mx-auto mt-4 h-16 w-auto object-contain" />
            <p class="mt-5 text-sm leading-6 text-gray-600">Bienvenue sur la plateforme de traçabilité du personnel mobile</p>

            <form class="space-y-5">
              <div>
                 <label class="mb-2 block text-sm font-medium text-gray-700">
                 <input type="text" placeholder="xxx@yahoo.fr"/>Email
              </label>
              </div>

              <label>
                <input type="password" placeholder="••••••••"/>Mot de passe
              </label>
              <input type="checkbox" />Se souvenir de moi
              <a href="#">Mot de passe oublié?</a>
              <button type="submit">Me connecter</button>
            </form>
          </div>
    </section>
    <div class="relative w-full h-64 md:h-full border border-green-500">
      <img src="@/assets/generic-2.jpg" alt="kaybic pic" class="absolute inset-0 w-full h-full object-cover "/>
    </div>
  </main>
</template>


