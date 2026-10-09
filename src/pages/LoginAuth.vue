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
                 <label class="mb-2 block text-sm font-medium text-gray-700">Email
                 <input type="text" placeholder="xxx@yahoo.fr" class="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/2"/>
              </label>
              </div>
              <div>
                 <label class="mb-2 block text-sm font-medium text-gray-700">Mot de passe
                 <input type="password" placeholder="******" class="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:ring-red-500/2"/>
              </label>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
                <label class="flex cursor-pointer items-center gap-2 text-gray-600">
                  <input type="checkbox" class="h-4 w-4 rounded border-gray-300 accent-red-600" />
                  <span>Se souvenir de moi</span>
                </label>
                <a href="#" class="font-medium text-gray-600 underline underline-offset-2 transition hover:text-red-600">Mot de passe oublié?</a>
              </div>
              <button type="submit" class="w-full rounded-md bg-red-600 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-[0.99]">Me connecter</button>
            </form>
          </div>
    </section>
    <section class="relative hidden min-h-screen overflow-hidden md:block">
      <img src="@/assets/generic-2.jpg" alt="kaybic pic" class="absolute inset-0 w-full h-full object-cover "/>
      <div class="absolute inset-0 bg-black/5" aria-hidden="true"></div>
    </section>
  </main>
</template>


