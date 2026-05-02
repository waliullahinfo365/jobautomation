import { disconnectDatabase } from "../client";
import { runDemoSeed } from "./index";
runDemoSeed().then(async()=>{ console.log('Demo seed completed'); await disconnectDatabase(); process.exit(0); }).catch(async(error)=>{ console.error('Demo seed failed',error); await disconnectDatabase(); process.exit(1); });
