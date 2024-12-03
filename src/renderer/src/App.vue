<template>
    <router-view></router-view>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const params = new URLSearchParams(window.location.search);
const page = params.get('page');
if (page == 'settings') {
    router.push('settings')
} else if (page == 'management') {
    router.push('management')
}
console.log('page', page);


</script>

<style>
body {
    margin: 0;
}
</style>
