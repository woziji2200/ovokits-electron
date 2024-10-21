<template>
    <router-view></router-view>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const params = new URLSearchParams(window.location.search);
const page = params.get('page');
if(page == 'settings'){
    router.push('settings')
}
console.log('poge', page);


</script>

<style>
body{
    margin: 0;
}
</style>
