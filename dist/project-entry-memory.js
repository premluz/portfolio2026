// A project visit has an explicit source, independent of the route used to
// reach its next/previous projects. Chat keeps its own older entry history.
export class ProjectEntryMemory{
 constructor(){this.route=null;}
 capture(route){this.route=route||'work';}
 backTarget(current,projectIds){return projectIds.includes(current)?this.route:null;}
 snapshot(){return this.route;}
 restore(route){this.route=route;}
 clear(){this.route=null;}
}
